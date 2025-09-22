import requests
import json

def get_comments(url):
    headers = {'User-Agent': 'RedditCommentScraper/1.0 (by /u/JicamaSufficient9298)'}  
    response = requests.get(url + '.json?limit=500', headers=headers)
    if response.status_code != 200:
        print(f"Error: {response.status_code}")
        return []
    
    data = response.json()
    comments = []
    
    def extract_comments(children):
        if not children:
            return []
        extracted = []
        for child in children:
            if child['kind'] != 't1':  # skip if not a comment
                continue

            replies = child['data'].get('replies')
            if isinstance(replies, dict):  # only if replies is a dict
                replies_children = replies.get('data', {}).get('children', [])
            else:
                replies_children = []

            comment = {
                'author': child['data'].get('author'),
                'body': child['data'].get('body'),
                'score': child['data'].get('score'),
                'replies': extract_comments(replies_children)
            }
            extracted.append(comment)
        return extracted

    
    # Comments are in data[1]['data']['children']
    if len(data) > 1 and 'data' in data[1] and 'children' in data[1]['data']:
        comments = extract_comments(data[1]['data']['children'])
    
    return comments


# Usage
post_url = "https://www.reddit.com/r/NepalSocial/comments/1nkb9eg"
all_comments = get_comments(post_url)


# Print comments (flattened with indentation for replies)
def print_comments(comments, level=0):
    for comment in comments:
        indent = '  ' * level
        print(f"{indent}- {comment['author']} (Score: {comment['score']}): {comment['body']}")
        if comment['replies']:
            print_comments(comment['replies'], level + 1)


print_comments(all_comments)
