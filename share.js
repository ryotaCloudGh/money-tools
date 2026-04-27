function setShareText(text) {
    const url = location.href.split('?')[0].split('#')[0];
    const tweetUrl = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(text + '\n') + '&url=' + encodeURIComponent(url);
    const lineUrl = 'https://line.me/R/msg/text/?' + encodeURIComponent(text + '\n' + url);
    const area = document.getElementById('share-area');
    if (!area) return;
    area.innerHTML =
        '<span class="share-label">結果をシェア</span>' +
        '<a href="' + tweetUrl + '" target="_blank" rel="noopener" class="share-btn share-btn-x">𝕏 でシェア</a>' +
        '<a href="' + lineUrl + '" target="_blank" rel="noopener" class="share-btn share-btn-line">LINE でシェア</a>' +
        '<span class="share-note">金額・資産額は投稿に含まれません</span>' +
        '<div class="share-privacy">入力した数字はお使いのデバイスのみに保存されます。リンクをシェアしても外部には送信されません。</div>';
}
