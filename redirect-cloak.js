addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const { searchParams } = new URL(request.url)
  const targetUrl = searchParams.get('r')

  if (!targetUrl) {
      return Response.redirect('https://managingwp.io', 302)
  }

  // Check if targetUrl is a valid URL
  try {
      new URL(targetUrl)
  }
  catch (error) {
      return new Response(
          `<!DOCTYPE html>
          <html lang='en'>
          <head>
          <title>Invalid URL</title>
          </head>
          <body>
          <h1>Invalid URL</h1>
          <p>The URL you entered is not valid. Please try again.</p>
          </body>
          </html>`,
          {
              headers: {
                  'content-type': 'text/html;charset=UTF-8',
              },
          }
      )
  }

  let { title, description, image } = await fetchTags(targetUrl)

  return new Response(
      `<!DOCTYPE html>
      <html lang='en'>
      <head>
      <!-- ${targetUrl} -->
      <title>${title}</title>
      <meta name="description" content="${description}">
      <meta property="og:image" content="${image}">
      <style>
          body {
              font-family: Arial, sans-serif;
              text-align: center;
              margin-top: 50px;
          }
          img {
              max-width: 100%;
              height: auto;
          }
      </style>
      </head>
      <body>
      <h1>${title}</h1>
      <img src="${image}" alt="Article Image">
      <p>${description}</p>
      <p>Redirecting to article now...</p>
      <script type="text/javascript">
      setTimeout(() => {
          window.location.href = "${targetUrl}";
      }, 5000);
      </script>
      </body>
      </html>`,
      {
          headers: {
              'content-type': 'text/html;charset=UTF-8',
          },
      }
  )
}

async function fetchTags(url) {
  try {
      const response = await fetch(url)
      const text = await response.text()

      const titleMatch = text.match(/<title>([^<]*)<\/title>/i)
      const descriptionMatch = text.match(/<meta name="description" content="([^"]*)"/i)
      const imageMatch = text.match(/<meta property="og:image" content="([^"]*)"/i)

      const title = titleMatch ? titleMatch[1] : 'No title found'
      const description = descriptionMatch ? descriptionMatch[1] : 'No description found'
      const image = imageMatch ? imageMatch[1] : 'No image found'

      return { title, description, image }
  } catch (error) {      
      return { title: `Error fetching title: ${error.message}`, description: `Error fetching description: ${error.message}`, image: `Error fetching image: ${error.message}` }
  }
}
