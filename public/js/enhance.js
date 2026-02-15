// ============================================
// PROMPT ENHANCER - Frontend Logic
// ============================================

let selectedMode = 'general';
let enhancedResult = '';

// === Mode Selection ===
document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedMode = btn.dataset.mode;
    });
});

// === Character Counter ===
const promptInput = document.getElementById('promptInput');
const charCount = document.getElementById('charCount');

promptInput.addEventListener('input', () => {
    const len = promptInput.value.length;
    charCount.textContent = `${len.toLocaleString()} chars`;
});

// === Keyboard Shortcut ===
promptInput.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        enhancePrompt();
    }
});

// === Main Enhance Function ===
async function enhancePrompt() {
    const prompt = promptInput.value.trim();

    if (!prompt) {
        showError('Please enter a prompt to enhance.');
        return;
    }

    if (prompt.length < 5) {
        showError('Please enter a longer prompt (at least 5 characters).');
        return;
    }

    const btn = document.getElementById('enhanceBtn');
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
        const response = await fetch('/api/enhance', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: prompt,
                mode: selectedMode
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to enhance prompt');
        }

        enhancedResult = data.enhanced;
        resultContent.innerHTML = markdownToHTML(data.enhanced);
        if (resultHeader) resultHeader.style.display = '';
        resultSection.classList.add('visible');

        showToast('success', '<i class="fa-solid fa-wand-magic-sparkles"></i>', 'Prompt enhanced successfully!');

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
    if (!enhancedResult) return;

    try {
        await navigator.clipboard.writeText(enhancedResult);
        const copyBtn = document.getElementById('copyBtn');
        copyBtn.classList.add('copied');
        copyBtn.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
        showToast('success', '<i class="fa-regular fa-clipboard"></i>', 'Copied to clipboard!');

        setTimeout(() => {
            copyBtn.classList.remove('copied');
            copyBtn.innerHTML = '<i class="fa-regular fa-clipboard"></i>';
        }, 2000);
    } catch (err) {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = enhancedResult;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast('success', '<i class="fa-regular fa-clipboard"></i>', 'Copied to clipboard!');
    }
}

// === Download Result ===
function downloadResult() {
    if (!enhancedResult) return;

    const blob = new Blob([enhancedResult], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `enhanced-prompt-${Date.now()}.md`;
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
        // Code blocks
        .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
        // Inline code
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        // Headers
        .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        // Bold and Italic
        .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        // Blockquotes
        .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
        // Unordered lists
        .replace(/^[\-\*] (.+)$/gm, '<li>$1</li>')
        // Ordered lists
        .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
        // Horizontal rule
        .replace(/^---$/gm, '<hr>')
        // Line breaks and paragraphs
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');

    // Wrap in paragraph
    html = '<p>' + html + '</p>';

    // Clean up
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