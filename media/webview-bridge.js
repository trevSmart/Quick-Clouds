// Bridge script injected into Write-Off webview
// - Replaces window.alert to use VS Code notifications via postMessage
// - Can be extended for confirm/prompt if needed
(function () {
	try {
		// Ensure only one VS Code API instance exists per webview
		let vscode = null;
		if (typeof window !== 'undefined' && window.__vscodeApi) {
			vscode = window.__vscodeApi;
		} else if (typeof acquireVsCodeApi === 'function') {
			try {
				vscode = acquireVsCodeApi();
				if (typeof window !== 'undefined') {
					window.__vscodeApi = vscode;
				}
			} catch (_) {
				// If acquisition fails, leave vscode as null
				vscode = null;
			}
		}
		if (!vscode) {
			return;
		}

		const originalAlert = window.alert;
		window.alert = function (msg) {
			try {
				// Alerts from webview represent validation warnings by default
				vscode.postMessage({ command: 'notify', level: 'warning', message: String(msg) });
			} catch (e) {
				try {
					if (originalAlert) {
						originalAlert(String(msg));
					}
				} catch (_) {
					// ignore
				}
			}
		};

		// Optionally, forward console.warns as low-priority notifications in debug
		// window.console.warn = (function(orig){
		//   return function(){
		//     try { vscode.postMessage({ command: 'log', level: 'warn', message: Array.from(arguments).join(' ') }); } catch(_) {}
		//     orig.apply(console, arguments);
		//   };
		// })(window.console.warn);
	} catch (_) {
		// noop
	}

	// Post-process write-off UI subtitles to show "<file>, line <n>"
	try {
		const deriveFile = (raw) => {
			if (!raw) {
				return '';
			}
			// If pattern like "Name - file.ext" -> take file.ext
			const parts = String(raw).split(' - ');
			const candidate = parts[parts.length - 1];
			// Fallback: last token that looks like filename.ext
			const m = candidate.match(/[A-Za-z0-9_.\-]+\.[A-Za-z0-9]+/);
			return m ? m[0] : candidate || String(raw);
		};
		const rewrite = (root) => {
			if (!root) {
				return;
			}
			root.querySelectorAll('.issue-item, .issue-item-single').forEach(it => {
				const lineEl = it.querySelector('.issue-line');
				if (!lineEl) {
					return;
				}
				let fileFromSibling = '';
				const elemEl = it.querySelector('.issue-element');
				if (elemEl) {
					fileFromSibling = elemEl.textContent || '';
				}

				// Try parse from current line text: "Line 12: something"
				const txt = lineEl.textContent || '';
				let lineNo = '';
				const m = txt.match(/Line\s+(\d+)/i);
				if (m) {
					lineNo = m[1];
				}

				const file = deriveFile(fileFromSibling || txt);
				if (file && lineNo) {
					lineEl.textContent = `${file}, line ${lineNo}`;
				}
				// Hide the redundant element label in bulk view
				if (elemEl && elemEl.parentElement) {
					elemEl.style.display = 'none';
				}
			});
		};
		// Run after load
		const run = () => {
			try {
				rewrite(document);
			} catch (_) {
				// ignore
			}
		};
		if (document.readyState === 'loading') {
			document.addEventListener('DOMContentLoaded', run, { once: true });
		} else {
			run();
		}

		// Also re-run shortly after data arrives from extension to catch React renders
		const scheduleBurst = () => {
			let count = 0;
			const h = setInterval(() => {
				run();
				if (++count >= 10) {
					clearInterval(h);
				}
			}, 150);
		};
		window.addEventListener('message', (e) => {
			const cmd = e && e.data && e.data.command;
			if (cmd === 'WOdata' || cmd === 'templatesData') {
				scheduleBurst();
			}
			if (cmd === 'writeoffSubmitted') {
				try {
					const d = e.data && e.data.data || {};
					const key1 = `${d.elementName}, line ${d.lineNumber}`; // after rewrite
					const key2 = `Line ${d.lineNumber}: ${d.elementName}`; // original
					// Find matching single-mode card and disable its button
					// First, clear global loading state effects in UI by re-enabling all buttons
					document.querySelectorAll('button.single-submit-btn').forEach(btn => {
						btn.disabled = false;
						if (btn.textContent && /Processing\.\.\./.test(btn.textContent)) {
							btn.textContent = 'Write-off';
						}
					});
					document.querySelectorAll('.issue-item-single').forEach(card => {
						const line = card.querySelector('.issue-line');
						const btn = card.querySelector('button.single-submit-btn');
						if (line && btn && typeof line.textContent === 'string') {
							const txt = line.textContent.trim();
							if (txt === key1.trim() || txt === key2.trim()) {
								btn.disabled = true;
								btn.textContent = 'Requested';
								btn.classList.add('disabled');
							}
						}
					});
				} catch (_) {
					// ignore
				}
			}
		});
	} catch (_) {
		/* ignore */
	}
})();
