import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
let query = '';

let searchInput = document.querySelector('.searchBar');

let filteredProjects = projects
renderProjects(filteredProjects, projectsContainer, 'h2');

    let svg = d3.select('svg')
    let legend = d3.select('.legend');
    
    let rolledData = d3.rollups(
        filteredProjects,
        (v) => v.length,
        (d) => d.year,
    );

    let data = rolledData.map(([year, count]) => {
        return { value: count, label: year};
    });


    let colors = d3.scaleOrdinal(d3.schemeTableau10);

    let sliceGenerator = d3.pie().value((d) => d.value);
    let arcData = sliceGenerator(data);
    let arcs = arcData.map((d) => arcGenerator(d));


    arcs.forEach((arc, idx) => {
        svg.append('path').attr('d', arc).attr('fill',colors(idx))
    });

    
    data.forEach((d, idx) => {
    legend
        .append('li')
        .attr('class', 'legend-item')
        .attr('style', `--color:${colors(idx)}`) // set the style attribute while passing in parameters
        .html(`<span class="swatch">O</span> ${d.label} <em>(${d.value})</em>`); // set the inner html of <li>
    });


searchInput.addEventListener('change', (event) => {
  // update query value
  query = event.target.value;
  // TODO: filter the projects
    let doubleFilteredProjects = filteredProjects.filter((project) => {
        let values = Object.values(project).join('\n').toLowerCase();
        return values.includes(query.toLowerCase());
    });

  // TODO: render updated projects!
  renderProjects(doubleFilteredProjects, projectsContainer, 'h2');
    
    
});

let selectedIndex = -1;


svg.selectAll('path').remove();

arcs.forEach((arc, i) => {
  svg
    .append('path')
    .attr('d', arc)
    .attr('fill', colors(i))
    .on('click', () => {
      selectedIndex = selectedIndex === i ? -1 : i;
        svg
        .selectAll('path')
        .attr('class', (_, idx) => (
        idx === selectedIndex ? 'selected' : ''
        ));
        legend.selectAll('li').select('span').attr('class', (_, idx) => (
        idx === selectedIndex ? 'selected' : 'swatch'
    ))
    if (selectedIndex === -1) {
        renderProjects(projects, projectsContainer, 'h2');
    } else {
        
        filteredProjects = projects.filter((project) => {
            
            return data[selectedIndex]['label'] === project.year
        })
        renderProjects(filteredProjects, projectsContainer, 'h2');
    }

    });
    
    

});















