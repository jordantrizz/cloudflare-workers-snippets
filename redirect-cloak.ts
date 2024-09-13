// Setup worker secrets
let appURL;
declare var mwp_redirect_cache_kv: KVNamespace;


addEventListener('fetch', event => {
  // Set appURL when the fetch event is triggered
  appURL = new URL(event.request.url).origin;
  console.log('appURL set to:', appURL); // Log the value of appURL
  event.respondWith(handleRequest(event));
});

// Main function to handle requests
async function handleRequest(event) {
  const { request } = event;
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('r');
  const appURL = request.url.split('?')[0];
  let cacheExists = false
  let cacheAge = null
  let MethodsTried = [];
  let response;

  // Set array for methods tried.
  let methodsTried = [];
  let botBlocked = false;
  let siteMetaData = {
    title: '',
    description: '',
    image: ''
  };
  let metadata_fetchTags;
  let metadata_fetchOpenGraph;
  let URLmetadata = {};

  // App Settings
  const opengraphDisabled = true;  
  const cacheDisabled = false;
  const OpenGraphapiKey = '229f316a-fdf2-4ea3-adbc-ddcce518695f'; // Set this to your OpenGraph.io API key, or leave empty if not using OpenGraph.io
  
  // Setup array of titles for bot detection
  const botTitles = [
    'Bloomberg - Are you a robot?'
  ]
  
  // ====================================================================================================
  // Start Loop
  // ====================================================================================================

  // If no URL provided print out a submission form asking for URL
  if ( searchParams.get('clear') ) {
    const clear = searchParams.get('clear');
    debugC(`Clearing cache for ${clear}`);
    await clearCache(clear);
    response = printClearCachePage(clear);
    return response;
  } else if (!targetUrl) {
    response = printIndexPage();
    return response;
  }

  // Check if URL is valid
  debugC(`Checking URL: ${targetUrl}`);
  try {
    new URL(targetUrl);
  } catch (error) {
    response = printErrorPage(targetUrl, error);
    return response;
  }

  // Check if caching is enabled and if cache exists
  if (!cacheDisabled) {
    debugC('Cache enabled'); 
    cacheAge = await checkCache(targetUrl);
    cacheExists = cacheAge ? true : false;
    debugC(`Cache Exists: ${cacheExists}, Cache Age: ${cacheAge}`);
  } else {
    debugC('Cache disabled');
  }

// Check if cache exists
  if (!cacheExists || cacheDisabled) {
    debugC('Cache does not exist');
    // Get siteMetaData for url. Try fetchTags first, then OpenGraph.io as fallback
    try {
      debugC('Fetching metadata');
      metadata_fetchTags = await fetchTags(targetUrl);
      methodsTried.push('fetchTags');
      // Process metadata and if any null values, set to a generic message
      siteMetaData = {
        title: metadata_fetchTags.title || 'No title available',
        description: metadata_fetchTags.description || 'No description available',
        image: metadata_fetchTags.image || 'No image found'
      };  

    } catch (error) {
      siteMetaData = { title: `Error fetching title: ${error.message}`, description: `Error fetching description: ${error.message}`, image: `Error fetching image: ${error.message}` };
    }

    // Check if opengraph is available for fallback
    if (!opengraphDisabled) {
      debugC('OpenGraph.io enabled');
      // Check if error fetching and use opengraph.io as fallback
      if (metadata_fetchTags.title.startsWith('Error fetching') || metadata_fetchTags.description.startsWith('Error fetching') || metadata_fetchTags.image.startsWith('Error fetching')) {
        metadata_fetchOpenGraph = await fetchOpenGraph(targetUrl,OpenGraphapiKey);
        // Add to methods tried
        siteMetaData = metadata_fetchOpenGraph;
        methodsTried.push('OpenGraph.io');
      }

      // Check array of botTitles for bot detection and use opengraph.io as fallback
      if (botTitles.includes(metadata_fetchTags.title)) {
        metadata_fetchOpenGraph = await fetchOpenGraph(targetUrl,OpenGraphapiKey);
        // Add to methods tried
        siteMetaData = metadata_fetchOpenGraph;
        methodsTried.push('OpenGraph.io');
        botBlocked = true;
      }
    }

    // Set metadata to use for response
    const { title, description, image } = siteMetaData;
    
    // Set HTML content for image, check for "Error fetching" messages
    debugC('Setting HTML content');
    let imageOG, imageHTML;
    if (image.startsWith('Error fetching')) {
      imageOG = ''
      imageHTML = '<p>No image found</p>'
    } else if (image.startsWith('No image found')) {
      imageOG = ''
      imageHTML = '<p>No image found</p>'
    } else {
      imageOG = `<meta property="og:image" content="${image}">`
      imageHTML = `<img src="${image}" alt="Article Image">`
    }

    // Set HTML Content for description, check for "Error fetching" messages
    let descriptionHTML;
    if (description.startsWith('Error fetching')) {
      descriptionHTML = '<p>No description found</p>'
    } else {
      descriptionHTML = `<p>Article Description: ${description}</p>`
    }

    // Obfuscate targetUrl with JavaScript so the url can't be detected by scrapers
    const javascript = obfuscateUrl(targetUrl)

    // Create array with all attributes to pass to functions and cache
    URLmetadata = { targetUrl, title, description, image, descriptionHTML, imageOG, imageHTML, javascript, methodsTried, botBlocked, metadata_fetchTags, metadata_fetchOpenGraph }    
    await createCache(targetUrl, URLmetadata);

  } else {
    // Grab data from cache
    const cachedMetadata = await getCache(targetUrl);
    if ( cachedMetadata != null ) {
      debugC('Cache exists');
      cacheExists = true;
      debugC(cachedMetadata);      
      URLmetadata = cachedMetadata;
      methodsTried.push('Cache');
    } else {
      debugC('Cache exists, but no data')
      printErrorPage(targetUrl, 'Cache exists, but no data');
    }
  }

  debugC('Returning response');
  // If user agent = facebookexternalhit/1.1 or Facebot, return OG tags
  const userAgent = request.headers.get('User-Agent')
  if (userAgent && (userAgent.includes('facebookexternalhit/1.1') || userAgent.includes('Facebot'))) {
    response = returnOGTitle(URLmetadata)
  } else {    
    response = returnOGUser(URLmetadata, cacheExists, cacheAge)
    // Return HTML with title, description, image, and redirect to targetUrl
  }    
  return response;
}

// Print Debug Console Log
function debugC(message) {
  console.log(message);
}

// Print Error page
function printErrorPage(targetUrl, error) {
  return new Response(
    `<!DOCTYPE html>
    <html lang='en'>
    <head>
    <title>Error</title>
    </head>
    <body>
    <h1>Error</h1>
    <p>URL ${targetUrl}</p>
    <p>${error.message}</p>
    <a href="${appURL}">Return to Redirect Cloak</a>
    </body>
    </html>`,
    {
      headers: {
        'content-type': 'text/html;charset=UTF-8',
      },
    }
  );
}

// Print index page
function printIndexPage() {
  return new Response(
    `<!DOCTYPE html>
    <html lang='en'>
    <head>
    <title>Redirect Cloak</title>
    </head>
    <body>
    <h1>Redirect Cloak</h1>
    <p>Enter a URL to cloak:</p>
    <form action="${appURL}" method="get">
    <input type="text" name="r" placeholder="Enter URL">
    <button type="submit">Submit</button>
    </form>
    </body>
    </html>`,
    {
      headers: {
        'content-type': 'text/html;charset=UTF-8',
      },
    }
  );
}

// Function print clear cache page
function printClearCachePage(clearUrl) {
  return new Response(
    `<!DOCTYPE html>
    <html lang='en'>
    <head>
    <title>Redirect Cloak</title>
    </head>
    <body>
    <h1>Cache Cleared</h1>
    <p>Cache for ${clearUrl} has been cleared.</p>
    <a href="${appURL}">Return to Redirect Cloak</a>
    </body>
    </html>`,
    {
      headers: {
        'content-type': 'text/html;charset=UTF-8',
      },
    }
  );
}

// Function to print cache clear failure
function printClearCacheFailurePage(clearUrl, cacheExists) {
  const cacheFailureReason = cacheExists ? 'Unknown Failure' : 'Cache does not exist';
  
  return new Response(
    `<!DOCTYPE html>
    <html lang='en'>
    <head>
    <title>Redirect Cloak</title>
    </head>
    <body>
    <h1>Cache Clear Failed</h1>
    <p>Cache for ${clearUrl} could not be cleared.</p>
    <a href="${appURL}">Return to Redirect Cloak</a>
    </body>
    </html>`,
    {
      headers: {
        'content-type': 'text/html;charset=UTF-8',
      },
    }
  );
}

// Function to return og titles to Facebook
function returnOGTitle(URLmetadata) {
  const { title, descriptionHTML, imageOG } = URLmetadata;
  return new Response(
    `<!DOCTYPE html>
    <html lang='en'>
    <head>
    <title>${title}</title>
    ${descriptionHTML}
    ${imageOG}
    </head>
    </html>`,
    {
        headers: {
            'content-type': 'text/html;charset=UTF-8',
        },
    }
  )
}

// Function to return redirect to user
function returnOGUser(metadata, cacheExists, cacheAge) {
  const { targetUrl, title, descriptionHTML, imageHTML, javascript, methodsTried, botBlocked, metadata_fetchTags, metadata_fetchOpenGraph } = metadata;
  debugC(`targetURL: ${targetUrl}, title: ${title}, descriptionHTML: ${descriptionHTML}, imageHTML: ${imageHTML}, javascript: ${javascript}, methodsTried: ${methodsTried}, botBlocked: ${botBlocked}, metadata_fetchTags: ${metadata_fetchTags}, metadata_fetchOpenGraph: ${metadata_fetchOpenGraph}, cacheExists: ${cacheExists}, cacheAge: ${cacheAge}`);
  let cacheHTML
  if ( cacheExists = true ) {
    cacheHTML = `<p>Cache Exists: ${cacheExists}, ${cacheAge} - <a href="${appURL}/?clear=${targetUrl}">Clear Cache</a>`
  } else {
    cacheHTML = `<p>Cache Doesn't Exist: ${cacheExists}`
  }

  return new Response(
    `<!DOCTYPE html>
    <html lang='en'>
    <head>
    <!-- ${targetUrl} -->
    <title>${title}</title>
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
        article {
            max-width: 800px;
            margin: 0 auto;
            background-color: #f9f9f9;
        }
    </style>
    </head>
    <body>
    <div id="article">
      <h1>Article Title: ${title}</h1>
      ${imageHTML}
      ${descriptionHTML}
    </div>
    <hr>
    <p>Redirecting to article now...</p>
    ${javascript}
    <pre>
    Methods Tried: ${methodsTried.join(', ')}
    Bot Blocked: ${botBlocked}</p>
    metdata_fetchTags: ${JSON.stringify(metadata_fetchTags)}
    metdata_fetchOpenGraph: ${JSON.stringify(metadata_fetchOpenGraph)}
    </pre>
    ${cacheHTML}
    </body>
    </html>`,
    {
        headers: {
            'content-type': 'text/html;charset=UTF-8',
        },
    }
  )
}

// Function to Obfuscate targetUrl with JavaScript so the url can't be detected by scrapers
function obfuscateUrl(targetUrl) {
  return `<script>window.location
  .replace(atob('${btoa(targetUrl)}
  .replace(/-/g, '+')
  .replace(/_/g, '/'))</script>`
}

// Fetch title, description, and image from a URL
async function fetchTags(url) {
  try {
      // Set an appropriate user agent for the website you're fetching
      const headers = new Headers()
      headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36')
      const response = await fetch(url, { headers })
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

// Fetch opengraph.io data
async function fetchOpenGraph(targetUrl, OpenGraphapiKey) {
  interface HybridGraph {
    title: string;
    description: string;
    image: string;
  }
  
  interface ApiResponse {
    hybridGraph: HybridGraph;
  }
  const apiUrl = `https://opengraph.io/api/1.1/site/${encodeURIComponent(targetUrl)}?app_id=${OpenGraphapiKey}`;

  if (!OpenGraphapiKey) {
    return {
      title: 'API key not provided',
      description: 'API key not provided',
      image: 'API key not provided'
    };
  }

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    return {
      title: data.hybridGraph.title || 'No title found',
      description: data.hybridGraph.description || 'No description found',
      image: data.hybridGraph.image || 'No image found'
    };
  } catch (error) {
    return {
      title: `Error fetching title: ${error.message}`,
      description: `Error fetching description: ${error.message}`,
      image: `Error fetching image: ${error.message}`
    };
  }
}

// Function to clear kv namespace url
async function clearCache(url) {
  await mwp_redirect_cache_kv.delete(url);
}

// Function to create a cache item in KV object 
// that is the URL and metadata is json with a 24 hour expiration
// KV Bind is mwp-redirect-cloak
async function createCache(url, URLmetadata) {
  const metadataJson = JSON.stringify(URLmetadata);
  const expirationTtl = 86400; // 24 hours in seconds
  await mwp_redirect_cache_kv.put(url, metadataJson, { expirationTtl });
}

// Check if cache exists and return age
// Use KV Bind mwp-redirect-cloak
async function checkCache(url) {
  const cacheEntry = await mwp_redirect_cache_kv.get(url);
  let cacheAge;
  if (cacheEntry !== null) {
    const cacheMetadata = JSON.parse(cacheEntry);
    cacheAge = Math.floor((Date.now() - cacheMetadata.timestamp) / 1000);
    // Convert to human readable, hours, minutes, seconds.
    const hours = Math.floor(cacheAge / 3600);
    const minutes = Math.floor((cacheAge % 3600) / 60);
    const seconds = cacheAge % 60;
    cacheAge = `${hours}h ${minutes}m ${seconds}s`;
    return cacheAge;
  } else {
    return null;
  }
}

// Function to grab URLmetadata from cache
async function getCache(url) {
  const cache = caches.default;
  const cacheKey = new Request(url, { method: 'GET' });
  const cacheResponse = await cache.match(cacheKey);
  if (cacheResponse) {
    const metadataHeaders = cacheResponse.headers.get('URLmetadata');
    return metadataHeaders ? JSON.parse(metadataHeaders) : null;
  } else {
    return null;
  }
}