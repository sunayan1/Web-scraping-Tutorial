import requests

# sends get requests to the URL
response= requests.get('https://www.geeksforgeeks.org/python/python-programming-language-tutorial/')

# status_code return HTTP status code 
print(response.status_code)
# .content refers to the HTML content of the page.
print(response.content)