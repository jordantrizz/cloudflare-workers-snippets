// Source https://www.resdevops.com/2018/03/20/cloudflare-workers-maintenance-mode-static-page/

addEventListener("fetch", event => {
  event.respondWith(fetchAndReplace(event.request))
})
 
async function fetchAndReplace(request) {
 
  let modifiedHeaders = new Headers()
 
  modifiedHeaders.set('Content-Type', 'text/html')
  modifiedHeaders.append('Pragma', 'no-cache')
 
 
  //Return maint page if you're not calling from a trusted IP
  if (request.headers.get("cf-connecting-ip") !== "127.0.0.1") 
  {
    // Return modified response.
    return new Response(maintPage, {
      headers: modifiedHeaders
    })
  }
  else //Allow users from trusted into site
  {
    //Fire all other requests directly to our WebServers
    return fetch(request)
  }
}
 
let maintPage = `

<!doctype html>
<head>
<title>Site Maintenance</title>
<style>
  body { 
        text-align: center; 
        padding: 150px; 
        background: white; 
        background-size: cover;
        -webkit-background-size: cover;
        -moz-background-size: cover;
        -o-background-size: cover;
      }

    .content {
        background-color: rgba(255, 255, 255, 0.75); 
        background-size: 100%;      
        color: inherit;
        padding: 1px 100px 10px 100px;
        border-radius: 15px;        
    }

  h1 { font-size: 40pt;}
  body { font: 20px Helvetica, sans-serif; color: #333; }
  article { display: block; text-align: left; width: 75%; margin: 0 auto; }
  a:hover { color: #333; text-decoration: none; }
</style>
<meta http-equiv="refresh" content="5; URL=/" />
</head>
<body>
<article> 
  <div class="background">
    <div class="content">
      <h1>We&rsquo;ll be right back!</h1>
        <p>We're very sorry for the inconvenience but we&rsquo;re performing maintenance.</p>        
        <p><b>-Management</b></p>
    </div>
  </div>
</article>
</body>
`;
