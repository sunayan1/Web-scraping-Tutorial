import requests
from bs4 import BeautifulSoup

response= requests.get('https://www.geeksforgeeks.org/python/python-programming-language-tutorial')

#gives out messy html string into a structured tree
soup= BeautifulSoup(response.content, 'html.parser')

content_div= soup.find('div', class_='article-page_flex')
if content_div:
    for para in content_div.find_all('p'):
        print(para.text.strip())
else:
    print("No article content found")

# #gives a pretty format to the structured tree of html
# print(soup.prettify()) 