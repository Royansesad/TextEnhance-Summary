// ============================================
// TEXT ENHANCER - Frontend Logic
// ============================================

let selectedMode = 'general';
let selectedType = 'prompt';
let enhancedResult = '';

// === Incompatibility Matrix ===
const incompatibleCombos = {
    story: {
        technical: 'Story is not compatible with Technical mode.',
        academic: 'Story is not compatible with Academic mode.'
    }
};

// === Hero Content per Type ===
const heroContent = {
    prompt: {
        line1: 'Transform Chaos Into',
        line2: 'Powerful Prompts',
        description: 'Paste your messy, unclear, or rough prompt and watch it transform into a crystal-clear, highly effective AI instruction.',
        inputLabel: 'Your Raw Prompt',
        placeholder: "Paste your messy prompt here... e.g., 'buatkan website toko online yang bagus pake react sama ada keranjang belanja fiturnya lengkap' or 'write me code for app that tracks habit'",
        tip: 'Tip: The messier the input, the more impressive the transformation',
        btnText: '<i class="fa-solid fa-bolt" aria-hidden="true"></i> Enhance Prompt',
        enhancingText: 'Enhancing...',
        resultTitle: 'Enhanced Prompt'
    },
    text: {
        line1: 'Clarify & Polish',
        line2: 'Any Text Instantly',
        description: 'Paste your rough draft, essay, or paragraph and get a clearer, more polished version — grammar fixed, meaning sharpened.',
        inputLabel: 'Your Raw Text',
        placeholder: "Paste your text here... essays, paragraphs, explanations, articles, or any content you want to clarify and polish.",
        tip: 'Tip: Works best with paragraphs or essays that need clarity',
        btnText: '<i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i> Enhance Text',
        enhancingText: 'Enhancing...',
        resultTitle: 'Enhanced Text'
    },
    story: {
        line1: 'Bring Your Story',
        line2: 'To Life',
        description: 'Paste your rough story draft and watch it transform — richer descriptions, better flow, and more engaging narrative.',
        inputLabel: 'Your Raw Story',
        placeholder: "Paste your story here... short stories, novel chapters, creative writing drafts, or any narrative you want to enhance and enrich.",
        tip: 'Tip: Include character names and plot points for better enhancement',
        btnText: '<i class="fa-solid fa-feather-pointed" aria-hidden="true"></i> Enhance Story',
        enhancingText: 'Enhancing...',
        resultTitle: 'Enhanced Story'
    }
};

// === Content Type Dropdown ===
const contentTypeSelect = document.getElementById('contentType');
contentTypeSelect.addEventListener('change', () => {
    selectedType = contentTypeSelect.value;
    updateHero();
    checkCompatibility();
});

// === Update Hero Dynamically ===
function updateHero() {
    const content = heroContent[selectedType];

    const heroLine1 = document.getElementById('heroLine1');
    const heroLine2 = document.getElementById('heroLine2');
    const heroDesc = document.getElementById('heroDescription');
    const inputHeading = document.getElementById('input-heading');
    const promptInput = document.getElementById('promptInput');
    const tipText = document.getElementById('tipText');
    const enhanceBtnText = document.getElementById('enhanceBtnText');
    const enhancingText = document.getElementById('enhancingText');
    const resultHeading = document.getElementById('result-heading');

    // Animate transition
    heroLine1.style.opacity = '0';
    heroLine2.style.opacity = '0';
    heroDesc.style.opacity = '0';

    setTimeout(() => {
        heroLine1.textContent = content.line1;
        heroLine2.textContent = content.line2;
        heroDesc.textContent = content.description;
        inputHeading.textContent = content.inputLabel;
        promptInput.placeholder = content.placeholder;
        tipText.textContent = content.tip;
        enhanceBtnText.innerHTML = content.btnText;
        enhancingText.textContent = content.enhancingText;
        resultHeading.textContent = content.resultTitle;

        heroLine1.style.opacity = '1';
        heroLine2.style.opacity = '1';
        heroDesc.style.opacity = '1';
    }, 200);
}

// === Mode Selection ===
document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.mode-btn').forEach(b => {
            b.classList.remove('active');
            b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
        selectedMode = btn.dataset.mode;
        checkCompatibility();
    });
});

// === Check Compatibility ===
function checkCompatibility() {
    const warning = document.getElementById('compatWarning');
    const warningText = document.getElementById('compatWarningText');
    const enhanceBtn = document.getElementById('enhanceBtn');

    if (incompatibleCombos[selectedType] && incompatibleCombos[selectedType][selectedMode]) {
        warningText.textContent = incompatibleCombos[selectedType][selectedMode];
        warning.style.display = 'flex';
        enhanceBtn.disabled = true;
        enhanceBtn.classList.add('disabled-compat');
    } else {
        warning.style.display = 'none';
        enhanceBtn.disabled = false;
        enhanceBtn.classList.remove('disabled-compat');
    }
}

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
        showError('Please enter content to enhance.');
        return;
    }

    if (prompt.length < 5) {
        showError('Please enter longer content (at least 5 characters).');
        return;
    }

    // Check compatibility before sending
    if (incompatibleCombos[selectedType] && incompatibleCombos[selectedType][selectedMode]) {
        showError(incompatibleCombos[selectedType][selectedMode]);
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
                mode: selectedMode,
                type: selectedType
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to enhance content');
        }

        enhancedResult = data.enhanced;
        resultContent.innerHTML = markdownToHTML(data.enhanced);
        if (resultHeader) resultHeader.style.display = '';
        resultSection.classList.add('visible');

        const typeLabel = selectedType.charAt(0).toUpperCase() + selectedType.slice(1);
        showToast('success', '<i class="fa-solid fa-wand-magic-sparkles"></i>', `${typeLabel} enhanced successfully!`);

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
    a.download = `enhanced-${selectedType}-${Date.now()}.md`;
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