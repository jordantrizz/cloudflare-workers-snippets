// Install
//   1. Create a worker and deploy the following code.
//   2. Setup a route for domian.com/* and *.domain.com/*
//   3. Create a transform rule.
//          -HTTP Request Header Modification
//          -(ip.src eq 76.70.117.218)
//          -Set header "fail2banblock" = "1"
//

addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request))
})
 
async function handleRequest(request) {

  let modifiedHeaders = new Headers()
  modifiedHeaders.set('Content-Type', 'text/html')
  modifiedHeaders.append('Pragma', 'no-cache')
  modifiedHeaders.append('fail2bancfblock', 'enabled')
 
  const clientIP = request.headers.get('CF-Connecting-IP');
  const request_headers = request.headers.get('fail2banblock') || '';

  e = request;
  let client_headers = '';
  for (const element of e.headers) {
      client_headers = client_headers.concat(element[0], " => ", element[1], "<br>")
  }

let block_page = `
<!doctype html>
<head>
<title>Security Blocked </title>
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
      <h1>You've been blocked due to a security rule.</h1>
      <p>Your IP ${clientIP} has been blocked temporarily</p>
        <p><b>-Management</b></p>
    </div>
  </div>
  <div>
    <div style="font-weight:bold;">debug.</div>
    <div style="font-weight:bold;">request_headers</div>
    <code>${request_headers}</code>
    <br>
    <div style="font-weight:bold;">client_headers</div>
    <code>${client_headers}</code>
  </div>
</article>
</body>
`;

  // Return block page if you're not calling from a trusted IP
  if (clientIP !== "127.0.0.1")  {
    return new Response(block_page, { headers: modifiedHeaders})
  // Return a block page if Fail2banBlock = 1
  } else if (request_headers.includes('1')) {
    return new Response(block_page, { headers: modifiedHeaders})
  } else {
    //Allow users that aren't block    
    const passthrough = new Response(response.body, response);
    passthrough.headers.append('fail2bancfblock', 'enabled');
    return passthrough;
  }
}
