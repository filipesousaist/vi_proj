const tagContainer = document.querySelector('.tag-container');
const input = document.querySelector('.tag-container input');
input.placeholder = "Search tag here...";

let tags = [];

function createTag(label) {
  const div = document.createElement('div');
  div.setAttribute('class', 'tag');
  
	const span = document.createElement('span');
  span.innerHTML = label;
  span.setAttribute('style', 
    'font-family: Arial;' +
    'font-size: 14;' +
    'font-weight: bolder;' +
    'color: ' + g_tagToColor[label] + ';');
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
      let updated = false;

      e.target.value.split(',').forEach(tag => {
        for (let otherTag of tags)
          if (tag == otherTag)
            return;
        let exists = false; 
        for (let otherTag of g_allTags)
          if (tag.toUpperCase() == otherTag.toUpperCase()) {
            exists = true;
            tag = otherTag;
            break;
          }
        if (exists) {
          updated = true;
          g_selectedTags.push(tag);
          tags.push(tag);
          updateSuggestedTags(tag, false, false);

        }
      });
      if (updated){
        updatePlots();
        input.value = '';
      }
      addTags();
    }
});
document.addEventListener('click', (e) => {
  if (e.target.className === "close") {
    const tagLabel = e.target.getAttribute('data-item');
    const index = tags.indexOf(tagLabel);
		let i = g_selectedTags.indexOf(tags[index])
		if (i > -1) {
			g_selectedTags.splice(i, 1);
			updatePlots();
		}
    tags.splice(index, 1);
    addTags();
    updateSuggestedTags(tagLabel, true, false);
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