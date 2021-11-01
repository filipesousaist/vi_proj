const tagContainer = document.querySelector('.tag-container');
const input = document.querySelector('.tag-container input');
input.placeholder = "Search tag here";

let tags = [];

function createTag(label) {
  const div = document.createElement('div');
  div.setAttribute('class', 'tag');
  
	const span = document.createElement('span');
  span.innerHTML = label;
  div.appendChild(span);
	
	const closeBtn = document.createElement('span');
	closeBtn.classList.add('close');
	closeBtn.setAttribute('data-item', label);
	div.appendChild(closeBtn);

  return div;
}

function clearTags() {
  document.querySelectorAll('.tag').forEach(tag => {
    tag.parentElement.removeChild(tag);
  });
}

function addTags() {
  clearTags();
  tags.slice().reverse().forEach(tag => {
    tagContainer.prepend(createTag(tag));
  });
}

input.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
      e.target.value.split(',').forEach(tag => {
        tags.push(tag);  
      });
      
      addTags();
      input.value = '';
    }
});
document.addEventListener('click', (e) => {
  if (e.target.className === "close") {
    const tagLabel = e.target.getAttribute('data-item');
		console.log(tagLabel)
    const index = tags.indexOf(tagLabel);
		let i = g_selectedTags.indexOf(tags[index])
		if (i > -1) {
			g_selectedTags.splice(i, 1);
			updatePlots();
		}
    tags = [...tags.slice(0, index), ...tags.slice(index+1)];
    addTags();

  }
})

function updateTagBox(tag){
	tags.push(tag);
	addTags();
}

function clearTagBox(){
	clearTags();
	tags = [];
}

input.focus();