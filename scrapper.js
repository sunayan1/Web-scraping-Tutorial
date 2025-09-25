(async () => {
    var commentsDivXPath                 = '//div[contains(@class, "DivCommentListContainer")]';
    var allCommentsXPath                 = '//div[contains(@class, "DivCommentContentContainer")]';
    var level2CommentsXPath              = '//div[contains(@class, "DivReplyContainer")]';

    var publisherProfileUrlXPath         = '//span[contains(@class, "SpanUniqueId")]';
    var nicknameAndTimePublishedAgoXPath = '//span[contains(@class, "SpanOtherInfos")]';

    var likesCommentsSharesXPath         = "//strong[contains(@class, 'StrongText')]";

    var postUrlXPath                     = '//div[contains(@class, "CopyLinkText")]';
    var descriptionXPath                 = '//h4[contains(@class, "H4Link")]/preceding-sibling::div';

    var viewMoreDivXPath                 = '//p[contains(@class, "PReplyAction") and contains(., "View")]';

    function getElementsByXPath(xpath, parent) {
        let results = [];
        let query = document.evaluate(xpath, parent || document,
            null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        for (let i = 0, length = query.snapshotLength; i < length; ++i) {
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

    function getNickname(comment) {
        return getElementsByXPath('./div[1]/a', comment)[0].outerText;
    }

    function isReply(comment) {
        return comment.parentElement.className.includes('Reply');
    }

    function formatDate(strDate) {
        if (typeof strDate !== 'undefined' && strDate !== null) {
            let f = strDate.split('-');
            if (f.length == 1) {
                return strDate;
            } else if (f.length == 2) {
                return f[1] + '-' + f[0] + '-' + (new Date().getFullYear());
            } else if (f.length == 3) {
                return f[2] + '-' + f[1] + '-' + f[0];
            } else {
                return 'Malformed date';
            }
        } else {
            return 'No date';
        }
    }

    function extractNumericStats() {
        var strongTags = getElementsByXPath(likesCommentsSharesXPath);
        let likesCommentsShares = parseInt(strongTags[(strongTags.length - 3)]?.outerText)
            ? strongTags.slice(-3)
            : strongTags.slice(-2);
        return likesCommentsShares;
    }

    function csvFromComment(comment) {
        let nickname = getNickname(comment);
        let user = getElementsByXPath('./a', comment)[0]['href'].split('?')[0].split('/')[3].slice(1);
        let commentText = getElementsByXPath('./div[1]/p', comment)[0].outerText;
        let timeCommentedAgo = formatDate(getElementsByXPath('./div[1]/p[2]/span', comment)[0].outerText);
        let commentLikesCount = getElementsByXPath('./div[2]', comment)[0].outerText;
        let pic = getElementsByXPath('./a/span/img', comment)[0]
            ? getElementsByXPath('./a/span/img', comment)[0]['src']
            : "N/A";
        return quoteString(nickname) + ',' + quoteString(user) + ',' + 'https://www.tiktok.com/@' + user + ','
             + quoteString(commentText) + ',' + timeCommentedAgo + ',' + commentLikesCount + ',' + quoteString(pic);
    }

    // Load 1st level comments
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
            let commentsDiv = getElementsByXPath(commentsDivXPath)[0];
            commentsDiv.scrollIntoView(false);
            loadingCommentsBuffer--;
        }
        numOfcommentsBeforeScroll = numOfcommentsAftScroll;
        console.log('Loading 1st level comment number ' + numOfcommentsAftScroll);

        await new Promise(r => setTimeout(r, 300));
    }
    console.log('Opened all 1st level comments');

    // Load 2nd level comments
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
        console.log('Buffer ' + loadingCommentsBuffer);
    }
    console.log('Opened all 2nd level comments');

    // Extracting data
    var comments = getAllComments();
    var level2CommentsLength = getElementsByXPath(level2CommentsXPath).length;
    var publisherProfileUrl = getElementsByXPath(publisherProfileUrlXPath)[0].outerText;
    var nicknameAndTimePublishedAgo = getElementsByXPath(nicknameAndTimePublishedAgoXPath)[0].outerText.replaceAll('\n', ' ').split(' · ');
    var url = window.location.href.split('?')[0];
    var likesCommentsShares = extractNumericStats();
    var likes = likesCommentsShares[0].outerText;
    var totalComments = likesCommentsShares[1].outerText;
    var shares = likesCommentsShares[2] ? likesCommentsShares[2].outerText : "N/A";
    var commentNumberDifference = Math.abs(parseInt(totalComments) - (comments.length));

    var csv = 'Now,' + Date() + '\n';
    csv += 'Post URL,' + url + '\n';
    csv += 'Publisher Nickname,' + nicknameAndTimePublishedAgo[0] + '\n';
    csv += 'Publisher @,' + publisherProfileUrl + '\n';
    csv += 'Publisher URL,' + "https://www.tiktok.com/@" + publisherProfileUrl + '\n';
    csv += 'Publish Time,' + formatDate(nicknameAndTimePublishedAgo[1]) + '\n';
    csv += 'Post Likes,' + likes + '\n';
    csv += 'Post Shares,' + shares + '\n';
    csv += 'Description,' + quoteString(getElementsByXPath(descriptionXPath)[0].outerText) + '\n';
    csv += 'Number of 1st level comments,' + (comments.length - level2CommentsLength) + '\n';
    csv += 'Number of 2nd level comments,' + level2CommentsLength + '\n';
    csv += '"Total Comments (actual, in this list, rendered in the comment section; needs all comments to be loaded!)",' + (comments.length) + '\n';
    csv += "Total Comments (which TikTok tells you; it's too high most of the time OR too low due to limits)," + totalComments + '\n';
    csv += "Difference," + commentNumberDifference + '\n';
    csv += 'Comment Number (ID),Nickname,User @,User URL,Comment Text,Time,Likes,Profile Picture URL,Is 2nd Level Comment,User Replied To,Number of Replies\n';

    var count = 1;
    var totalReplies = 0;
    var repliesSeen = 1;
    for (var i = 0; i < comments.length; i++) {
        csv += count + ',' + csvFromComment(comments[i]) + ',';
        if (i > 0 && isReply(comments[i])) {
            csv += "Yes," + quoteString(getNickname(comments[i - repliesSeen])) + ',0';
            repliesSeen += 1;
        } else {
            csv += 'No,---,';
            totalReplies = 0;
            repliesSeen = 1;
            for (var j = 1; j < comments.length - i; j++) {
                if (!isReply(comments[i + j])) break;
                totalReplies += 1;
            }
            csv += totalReplies;
        }
        csv += '\n';
        count++;
    }

    var apparentCommentNumber = parseInt(totalComments);
    console.log('Number of missing comments: ' + (apparentCommentNumber - count + 1));
    
    // Download CSV file
    let blob = new Blob([csv], { type: "text/csv" });
    let urlObj = URL.createObjectURL(blob);
    let a = document.createElement("a");
    a.href = urlObj;
    a.download = "tiktok_comments.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(urlObj);

    console.log("CSV file downloaded: tiktok_comments.csv");
})();
