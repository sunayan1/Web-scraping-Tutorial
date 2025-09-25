(async () => {
    var allCommentsXPath    = '//div[contains(@class, "DivCommentContentContainer")]';
    var viewMoreDivXPath    = '//p[contains(@class, "PReplyAction") and contains(., "View")]';

    function getElementsByXPath(xpath, parent) {
        let results = [];
        let query = document.evaluate(xpath, parent || document,
            null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        for (let i = 0; i < query.snapshotLength; ++i) {
            results.push(query.snapshotItem(i));
        }
        return results;
    }

    function getAllComments() {
        return getElementsByXPath(allCommentsXPath);
    }

    function quoteString(s) {
        return '"' + String(s).replaceAll('"', '""') + '"';
    }

    // Extract only the comment text
    function getCommentText(comment) {
        let node = getElementsByXPath('./div[1]/p', comment)[0];
        return node ? node.outerText : "";
    }

    // Load all comments
    var loadingCommentsBuffer = 30;
    var numOfcommentsBeforeScroll = getAllComments().length;
    while (loadingCommentsBuffer > 0) {
        let allComments = getAllComments();
        let lastComment = allComments[allComments.length - 1];
        lastComment.scrollIntoView(false);

        let numOfcommentsAftScroll = getAllComments().length;

        if (numOfcommentsAftScroll !== numOfcommentsBeforeScroll) {
            loadingCommentsBuffer = 15;
        } else {
            loadingCommentsBuffer--;
        }
        numOfcommentsBeforeScroll = numOfcommentsAftScroll;
        await new Promise(r => setTimeout(r, 300));
    }

    // Expand replies
    loadingCommentsBuffer = 5;
    while (loadingCommentsBuffer > 0) {
        let readMoreDivs = getElementsByXPath(viewMoreDivXPath);
        for (let i = 0; i < readMoreDivs.length; i++) {
            readMoreDivs[i].click();
        }

        await new Promise(r => setTimeout(r, 500));
        if (readMoreDivs.length === 0) {
            loadingCommentsBuffer--;
        } else {
            loadingCommentsBuffer = 5;
        }
    }

    // Extract only comments
    var comments = getAllComments();
    var csv = 'Comment Text\n';

    for (var i = 0; i < comments.length; i++) {
        csv += quoteString(getCommentText(comments[i])) + '\n';
    }

    // Download CSV file
    let blob = new Blob([csv], { type: "text/csv" });
    let urlObj = URL.createObjectURL(blob);
    let a = document.createElement("a");
    a.href = urlObj;
    a.download = "tiktok_comments_only_text.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(urlObj);

    console.log("CSV file downloaded: tiktok_comments_only_text.csv");
})();
