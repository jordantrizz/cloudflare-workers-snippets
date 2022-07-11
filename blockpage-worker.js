addEventListener("fetch", event => {
  event.respondWith(fetchAndReplace(event.request))
})
 
async function fetchAndReplace(request) {
 
  let modifiedHeaders = new Headers() 
  modifiedHeaders.set('Content-Type', 'text/html')
  modifiedHeaders.append('Pragma', 'no-cache') 
  
  let block_ip = '';
  block_ip += '<p>Your IP ' + request.cf-connecting-ip + ' has been blocked temporarily</p>'; 

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
      ${block_ip}
        <p><b>-Management</b></p>
    </div>
  </div>
</article>
</body>
`;

  return new Response(block_page, {
    headers: modifiedHeaders
  })
}

