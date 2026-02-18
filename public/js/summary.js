// ============================================
// TEXT SUMMARY - Frontend Logic
// ============================================

let selectedMode = 'narrative';
let selectedLength = 'medium';
let summaryResult = '';

// === Style Dropdown Selection ===
const styleSelect = document.getElementById('summaryStyle');
styleSelect.addEventListener('change', () => {
    selectedMode = styleSelect.value;
});

// === Length Selection ===
document.querySelectorAll('.length-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.length-btn').forEach(b => {
            b.classList.remove('active');
            b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
        selectedLength = btn.dataset.length;
    });
});

// === Character Counter ===
const textInput = document.getElementById('textInput');
const charCount = document.getElementById('charCount');

textInput.addEventListener('input', () => {
    const len = textInput.value.length;
    charCount.textContent = `${len.toLocaleString()} chars`;
});

// === Keyboard Shortcut ===
textInput.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        summarizeText();
    }
});

// === Main Summarize Function ===
async function summarizeText() {
    const text = textInput.value.trim();

    if (!text) {
        showError('Please enter some text to summarize.');
        return;
    }

    if (text.length < 50) {
        showError('Please enter longer text (at least 50 characters) for a meaningful summary.');
        return;
    }

    const btn = document.getElementById('summarizeBtn');
    const resultSection = document.getElementById('resultSection');
    const resultContent = document.getElementById('resultContent');

    // Loading state
    btn.classList.add('loading');
    btn.disabled = true;
    hideError();

    // Show skeleton loader (hide header during loading)
    resultSection.classList.add('visible');
    const resultHeader = resultSection.querySelector('.result-header');
    if (resultHeader) resultHeader.style.display = 'none';
    resultContent.innerHTML = `
    <div class="skeleton skeleton-line" style="width: 95%"></div>
    <div class="skeleton skeleton-line" style="width: 88%"></div>
    <div class="skeleton skeleton-line" style="width: 92%"></div>
    <div class="skeleton skeleton-line" style="width: 75%"></div>
    <div class="skeleton skeleton-line" style="width: 85%"></div>
    <div class="skeleton skeleton-line" style="width: 60%"></div>
  `;

    try {
        const response = await fetch('/api/summarize', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: text,
                mode: selectedMode,
                length: selectedLength
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to summarize text');
        }

        summaryResult = data.summary;
        resultContent.innerHTML = markdownToHTML(data.summary);
        if (resultHeader) resultHeader.style.display = '';
        resultSection.classList.add('visible');

        showToast('success', '<i class="fa-solid fa-circle-check"></i>', `Summary generated in ${selectedMode} style!`);

    } catch (error) {
        console.error('Error:', error);
        showError(error.message || 'Something went wrong. Please try again.');
        resultSection.classList.remove('visible');
    } finally {
        btn.classList.remove('loading');
        btn.disabled = false;
    }
}

// === Copy Result ===
async function copyResult() {
    if (!summaryResult) return;

    try {
        await navigator.clipboard.writeText(summaryResult);
        const copyBtn = document.getElementById('copyBtn');
        copyBtn.classList.add('copied');
        copyBtn.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
        showToast('success', '<i class="fa-regular fa-clipboard"></i>', 'Copied to clipboard!');

        setTimeout(() => {
            copyBtn.classList.remove('copied');
            copyBtn.innerHTML = '<i class="fa-regular fa-clipboard"></i>';
        }, 2000);
    } catch (err) {
        const textarea = document.createElement('textarea');
        textarea.value = summaryResult;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast('success', '<i class="fa-regular fa-clipboard"></i>', 'Copied to clipboard!');
    }
}

// === Download Result ===
function downloadResult() {
    if (!summaryResult) return;

    const blob = new Blob([summaryResult], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `summary-${selectedMode}-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('success', '<i class="fa-solid fa-download"></i>', 'Downloaded successfully!');
}

// === Markdown to HTML Converter ===
function markdownToHTML(md) {
    if (!md) return '';

    let html = md
        .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
        .replace(/^[\-\*] (.+)$/gm, '<li>$1</li>')
        .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
        .replace(/^---$/gm, '<hr>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');

    html = '<p>' + html + '</p>';

    html = html
        .replace(/<p><\/p>/g, '')
        .replace(/<p>(<h[1-4]>)/g, '$1')
        .replace(/(<\/h[1-4]>)<\/p>/g, '$1')
        .replace(/<p>(<pre>)/g, '$1')
        .replace(/(<\/pre>)<\/p>/g, '$1')
        .replace(/<p>(<blockquote>)/g, '$1')
        .replace(/(<\/blockquote>)<\/p>/g, '$1')
        .replace(/<p>(<hr>)<\/p>/g, '$1')
        .replace(/<p>(<li>)/g, '<ul>$1')
        .replace(/(<\/li>)<\/p>/g, '$1</ul>')
        .replace(/<\/li><br><li>/g, '</li><li>');

    return html;
}

// === Toast Notification ===
function showToast(type, icon, message) {
    const toast = document.getElementById('toast');
    const toastIcon = document.getElementById('toastIcon');
    const toastText = document.getElementById('toastText');

    toast.className = `toast ${type}`;
    toastIcon.innerHTML = icon;
    toastText.textContent = message;

    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// === Error Handling ===
function showError(message) {
    const errorMsg = document.getElementById('errorMsg');
    const errorText = document.getElementById('errorText');
    errorText.textContent = message;
    errorMsg.classList.add('show');
}

function hideError() {
    const errorMsg = document.getElementById('errorMsg');
    errorMsg.classList.remove('show');
}