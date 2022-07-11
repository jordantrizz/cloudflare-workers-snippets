function printArray(arr) {
    if ( typeof(arr) == "object") {
        for (var i = 0; i < arr.length; i++) {
            printArray(arr[i]);
        }
    }
    else console.log(arr);
}

addEventListener('fetch', event => {
  const d =
    event.request.cf !== undefined
      ? event.request.cf
      : { error: 'The `cf` object is not available inside the preview.' };

 
  e = event.request;
  let client_headers = '';
  for (const element of e.headers) {
      client_headers = client_headers.concat(element[0], " => ", element[1], "<br>")
  }
   
  let cf_objects = '';
  //cf_objects = JSON.stringify(d, null, 2);
  for (var item in d) {
    if ( typeof(d[item]) == "object") {
      cf_objects += 'Array->';
        for (var i = 0; i < item.length; i++) {
          cf_objects += item[i] + ': ' + d[item][i] +';<br>';
        }
    } else {
    cf_objects += item + ': ' + d[item]+';<br>';
    }
  }
cf_objects += '<h2>JSON4</h2><code>' + JSON.stringify(d,'<br>') + '</code>';

 
  var host = e.headers.get("host")
  //let d = "test"
  let html = '<h1>CF Objects</h1><pre>' + cf_objects + '</pre><h1>Client headers</h1><pre>' + client_headers +'</pre>';
  
  return event.respondWith(
    new Response(JSON.stringify(html, null, 2), {
      headers: {
        'content-type': 'text/html;charset=UTF-8',
      },
    })
  );
});
