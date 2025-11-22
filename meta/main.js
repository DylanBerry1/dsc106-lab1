import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import scrollama from 'https://cdn.jsdelivr.net/npm/scrollama@3.2.0/+esm';



async function loadData() {
  const data = await d3.csv('loc.csv', (row) => ({
    ...row,
    line: Number(row.line), // or just +row.line
    depth: Number(row.depth),
    length: Number(row.length),
    date: new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime),
  }));

  return data;
}

let data = await loadData();

let commits = processCommits(data);
commits.sort((a, b) => a.datetime - b.datetime)
function processCommits(data) {
  return d3
    .groups(data, (d) => d.commit)
    .map(([commit, lines]) => {
        // Each 'lines' array contains all lines modified in this commit
        // All lines in a commit have the same author, date, etc.
        // So we can get this information from the first line
        let first = lines[0];
        let { author, date, time, timezone, datetime } = first;
        // What information should we return about this commit?
        let ret = {
            id: commit,
            url: 'https://github.com/DylanBerry1/dsc106-lab1/commit/' + commit,
            author,
            date,
            time,
            timezone,
            datetime,
            // Calculate hour as a decimal for time analysis
            // e.g., 2:30 PM = 14.5
            hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
            // How many lines were modified?
            totalLines: lines.length,
        };
      
        Object.defineProperty(ret, 'lines', {
            value: lines,
            writable: true,
            enumerable: true,
            configurable: true,
            // What other options do we need to set?
            // Hint: look up configurable, writable, and enumerable
        });
        
        return ret;
    });
}

function renderTooltipContent(commit) {
  const link = document.getElementById('commit-link');
  const date = document.getElementById('commit-date');

  if (Object.keys(commit).length === 0) return;

  link.href = commit.url;
  link.textContent = commit.id;
  date.textContent = commit.datetime?.toLocaleString('en', {
    dateStyle: 'full',
  });
}
    
function renderScatterPlot(data, commits) {
    const width = 1000;
    const height = 600;
    
    const svg = d3
        .select('#chart')
        .append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .style('overflow', 'visible');
    
    const xScale = d3
        .scaleTime()
        .domain(d3.extent(commits, (d) => d.datetime))
        .range([0, width])
        .nice();

    const yScale = d3.scaleLinear().domain([0, 24]).range([height, 0]);

    const dots = svg.append('g').attr('class', 'dots');

    dots
        .selectAll('circle')
        .data(commits, (d) => d.id)
        .join('circle')
        .attr('cx', (d) => xScale(d.datetime))
        .attr('cy', (d) => yScale(d.hourFrac))
        .attr('r', 5)
        .attr('fill', 'steelblue');
    
    const margin = { top: 10, right: 10, bottom: 30, left: 20 };
    
    const usableArea = {
        top: margin.top,
        right: width - margin.right,
        bottom: height - margin.bottom,
        left: margin.left,
        width: width - margin.left - margin.right,
        height: height - margin.top - margin.bottom,
    };

    // Add gridlines BEFORE the axes
    const gridlines = svg
    .append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left}, 0)`);

    // Create gridlines as an axis with no labels and full-width ticks
    gridlines.call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));

    
    // Update scales with new ranges
    xScale.range([usableArea.left, usableArea.right]);
    yScale.range([usableArea.bottom, usableArea.top]);

    // Create the axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3
        .axisLeft(yScale)
        .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');


    // Add X axis
    svg
    .append('g')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .attr('class', 'x-axis') // new line to mark the g tag
    .call(xAxis);

  svg
    .append('g')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .attr('class', 'y-axis') // just for consistency
    .call(yAxis);
    

}

function updateScatterPlot(data, commits) {
  const width = 1000;
  const height = 600;
  const margin = { top: 10, right: 10, bottom: 30, left: 20 };
  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  const svg = d3.select('#chart').select('svg');

  const xScale = d3
        .scaleTime()
        .domain(d3.extent(commits, (d) => d.datetime))
        .range([0, width])
        .nice();
  
  const yScale = d3.scaleLinear().domain([0, 24]).range([height, 0]);      
        
  const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
  const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 30]);

  const xAxis = d3.axisBottom(xScale);

  
  
  // CHANGE: we should clear out the existing xAxis and then create a new one.
  
  
  svg
    .append('g.x-axis')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .call(xAxis);
    
  svg.select('g.x-axis').selectAll('*').remove();
  svg.select('g.x-axis').call(xAxis);
  

  const dots = svg.select('g.dots');

  const sortedCommits = d3.sort(commits, (d) => -d.totalLines);
  dots
    .selectAll('circle')
    .data(sortedCommits, (d) => d.id)
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', (d) => rScale(d.totalLines))
    .attr('fill', 'steelblue')
    .style('fill-opacity', 0.7) // Add transparency for overlapping dots
    .on('mouseenter', (event, commit) => {
      d3.select(event.currentTarget).style('fill-opacity', 1); // Full opacity on hover
      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mouseleave', (event) => {
      d3.select(event.currentTarget).style('fill-opacity', 0.7);
      updateTooltipVisibility(false);
    });
}


function renderCommitInfo(data, commits) {
  // Create the dl element
  const dl = d3.select('#stats').append('dl').attr('class', 'stats');

  // Add total LOC
  dl.append('dt').html('Total Lines of Code:');
  dl.append('dd').text(data.length);

  // Add total commits
  dl.append('dt').text('Total Commits:');
  dl.append('dd').text(commits.length);

  // Add more stats as needed...
  
  //max depth
  dl.append('dt').html('Maximum Lines:');
  dl.append('dd').text(d3.max(commits, d => d.totalLines))
  
  //max length
  dl.append('dt').html('Longest Line:');
  dl.append('dd').text(d3.max(data, d => d.length))
  
  //min length
  dl.append('dt').html('Average Length:');
  dl.append('dd').text(Math.round(d3.mean(data, d => d.length)))
  
  //number of files
  dl.append('dt').html('Average Hour Of Commit:');
  dl.append('dd').text(Math.round(d3.median(commits, d => d.hourFrac)) >= 12 ? (Math.round(d3.mean(commits, d => d.hourFrac)) - 12).toString() + "PM" : (Math.round(d3.mean(commits, d => d.hourFrac))).toString() + "AM"); 
  
  
}

let commitProgress = 100;

let timeScale = d3
  .scaleTime()
  .domain([
    d3.min(commits, (d) => d.datetime),
    d3.max(commits, (d) => d.datetime),
  ])
  .range([0, 100]);
let commitMaxTime = timeScale.invert(commitProgress);
let filteredCommits = commits;
let colors = d3.scaleOrdinal(d3.schemeTableau10);



// let sliderObj = document.getElementById('commit-progress')
// sliderObj.addEventListener('change', onTimeSliderChange)

function onTimeSliderChange(latest) {
  // let sliderValue = (window.pageYOffset !== undefined) ? window.pageYOffset : (document.documentElement || document.body.parentNode || document.body).scrollTop
  
  // commitProgress = sliderValue
  // commitMaxTime = timeScale.invert(sliderValue)
  // document.getElementById('commit-time').innerHTML = commitMaxTime.toLocaleString()
  
  filteredCommits = commits.filter((d) => d.datetime <= latest);
  
  let lines = commits.flatMap((d) => d.lines);
  let files = d3
  .groups(lines, (d) => d.file)
  .map(([name, lines]) => {
    return { name, lines };
  })
  .sort((a, b) => b.lines.length - a.lines.length);

  
  let filesContainer = d3
  .select('#files')
  .selectAll('div')
  .data(files, (d) => d.name)
  .join(
    // This code only runs when the div is initially rendered
    (enter) =>
      enter.append('div').call((div) => {
        div.append('dt').append('code');
        div.append('dd');
      }),
  );

  // This code updates the div info
  filesContainer.select('dt > code').text((d) => d.name);
  filesContainer
  .select('dd')
  .selectAll('div')
  .data((d) => d.lines)
  .join('div')
  .attr('class', 'loc').attr('style', (d) => `--color: ${colors(d.type)}`);
  
  
  
  updateScatterPlot(data, filteredCommits)
}

d3.select('#scatter-story')
  .selectAll('.step')
  .data(commits)
  .join('div')
  .attr('class', 'step')
  .html(
    (d, i) => `<br>
		On ${d.datetime.toLocaleString('en', {
      dateStyle: 'full',
      timeStyle: 'short',
    })},
		I made <a href="${d.url}" target="_blank">${
      i > 0 ? 'another glorious commit' : 'my first commit, and it was glorious'
    }</a>.
		I edited ${d.totalLines} lines across ${
      d3.rollups(
        d.lines,
        (D) => D.length,
        (d) => d.file,
      ).length
    } files.
		
	`,
);

function onStepEnter(response) {
  console.log(response.element.__data__.datetime);
  onTimeSliderChange(response.element.__data__.datetime);
}


const scroller = scrollama();
scroller
  .setup({
    container: '#scrolly-1',
    step: '#scrolly-1 .step',
  })
  .onStepEnter(onStepEnter);






// onTimeSliderChange()
renderCommitInfo(data, commits);
renderScatterPlot(data, commits);
