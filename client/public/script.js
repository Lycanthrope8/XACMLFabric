document.addEventListener("DOMContentLoaded", function() {
          const forms = document.querySelectorAll('form');
          forms.forEach(form => {
              form.addEventListener('submit', function(event) {
                  event.preventDefault();
                  const formData = new FormData(form);
                  const url = form.getAttribute('action');
                  const method = form.getAttribute('method');
                  const request = new XMLHttpRequest();
                  request.open(method, url, true);
                  request.onload = function() {
                      if (request.status >= 200 && request.status < 400) {
                          const resp = document.createElement('div');
                          resp.textContent = 'Response: ' + request.responseText;
                          form.appendChild(resp);
                      } else {
                          console.error('Error from the server');
                      }
                  };
                  request.onerror = function() {
                      console.error('Error making the request');
                  };
                  request.send(new URLSearchParams(formData));
              });
          });
      });
      