// console.log('IT’S ALIVE!');

const BASE_PATH = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
  ? "/"                  // Local server
  : "/dsc106-lab1/";         // GitHub Pages repo name


function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}



let pages = [
  { url: '', title: 'Home' },
  { url: 'projects/', title: 'Projects' },
  { url: 'resume/', title: 'Resume'},
  { url: 'contacts/', title: 'Contacts'},
  { url: 'https://github.com/DylanBerry1', title: 'Github'}
];

let nav = document.createElement('nav');
document.body.prepend(nav);

for (let p of pages) {
    let url = p.url;
    let title = p.title;
    // next step: create link and add it to nav
    url = !url.startsWith('http') ? BASE_PATH + url : url;
    
    
    
    let a = document.createElement('a');
    a.href = url;
    a.textContent = title;
    
    console.log(a.host, a.pathname)
    console.log(a.host === location.host && a.pathname === location.pathname)
    if (a.host === location.host && a.pathname === location.pathname) {
        a.classList.add('jfkdj');
    }
    
    else if (a.host !== location.host) {
        a.target = '_blank'
    }
    nav.append(a);
    


}

document.body.insertAdjacentHTML(
'afterbegin',
`
    <label class="color-scheme">
        Theme:
        <select id='systemSettings'>
            <option value='light dark'>System</option>
            <option value='light'>Light</option>
            <option value='dark'>Dark</option>
        </select>
    </label>`,
);

let select = document.querySelector('select')
if ("colorScheme" in localStorage) {
    
    document.documentElement.style.setProperty('color-scheme', localStorage.colorScheme);
    select.value = localStorage.colorScheme;
}





select.addEventListener('input', function (event) {
//   console.log('color scheme changed to', event.target.value);
    document.documentElement.style.setProperty('color-scheme', event.target.value);
    localStorage.colorScheme = event.target.value
});



//lab 3 setups
// let navlinks = $$('nav a');

// let currentLink = navLinks.find(
//   (a) => a.host === location.host && a.pathname === location.pathname,
// );

// currentLink?.classList.add('jfkdj');
