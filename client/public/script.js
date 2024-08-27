document.addEventListener("DOMContentLoaded", function() {
          const forms = document.querySelectorAll('form');
          forms.forEach(form => {
              form.addEventListener('submit', function(event) {
                  event.preventDefault();
                  const formData = new FormData(form);
                  const url = form.getAttribute('action');
                  const method = form.getAttribute('method');
      
                  // Find the existing response container or create a new one
                  let respContainer = form.querySelector('.response');
                  if (!respContainer) {
                      respContainer = document.createElement('div');
                      respContainer.className = 'response';
                      form.appendChild(respContainer);
                  }
      
                  const request = new XMLHttpRequest();
                  request.open(method, url, true);
                  request.onload = function() {
                      if (request.status >= 200 && request.status < 400) {
                          respContainer.textContent = 'Response: ' + request.responseText;
                      } else {
                          respContainer.textContent = 'Server error. Please try again.';
                      }
                  };
                  request.onerror = function() {
                      respContainer.textContent = 'Request failed. Please check your connection.';
                  };
                  request.send(new URLSearchParams(formData));
              });
          });
      });
      