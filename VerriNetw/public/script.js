 // public/script.js
document.addEventListener('DOMContentLoaded', () => {
  const thoughtsContainer = document.getElementById('thoughts-container');

  // Funzione per caricare i pensieri
  const loadThoughts = async () => {
    const response = await fetch('/thoughts');
    const thoughts = await response.json();

    thoughtsContainer.innerHTML = ''; // Pulisci il contenitore

    thoughts.forEach(thought => {
      const thoughtElement = document.createElement('div');
      thoughtElement.classList.add('thought');

      const userElement = document.createElement('span');
      userElement.classList.add('user');
      userElement.textContent = thought.user;

      const timeElement = document.createElement('span');
      timeElement.classList.add('time');
      timeElement.textContent = thought.time;

      const contentElement = document.createElement('div');
      contentElement.classList.add('content');
      contentElement.textContent = thought.content;

      thoughtElement.appendChild(userElement);
      thoughtElement.appendChild(timeElement);
      thoughtElement.appendChild(contentElement);

      thoughtsContainer.appendChild(thoughtElement);
    });
  };

  // Carica i pensieri iniziali
  loadThoughts();
});
