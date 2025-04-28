const API_ROOT='server';

function setupSmoothScrolling(){
  const btns=document.querySelectorAll('.tab-btn');
  btns.forEach(b=>b.onclick=e=>{
    e.preventDefault();
    btns.forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    const t=document.querySelector(b.getAttribute('href'));
    if(t)window.scrollTo({top:t.offsetTop-80,behavior:'smooth'});
  });
  if(location.hash){
    const t=document.querySelector(location.hash);
    if(t)setTimeout(()=>window.scrollTo({top:t.offsetTop-80,behavior:'smooth'}),300);
  }
}

document.addEventListener('DOMContentLoaded',()=>{
  const p=new URLSearchParams(location.search);
  const cid=p.get('id');
  if(!cid){location.href='category.html';return;}
  setupSmoothScrolling();
  loadCourseDetails(cid);
  loadCourseReviews(cid);
  loadRelatedCourses(cid);
});

async function loadCourseDetails(id){
  const r=await fetch(`${API_ROOT}/get_course.php?id=${id}`);
  const c=await r.json();
  if(c.error)return;
  document.title=`${c.title}|Byway`;
  const catEl = document.querySelector('.course-category-link');
  if (catEl) catEl.textContent=c.category;
  const titleEl = document.querySelector('.course-detail-title');
  if (titleEl) titleEl.textContent=c.title;
  const descEl = document.querySelector('.course-detail-description');
  if (descEl) descEl.textContent=c.description;
  const aboutEl = document.querySelector('.course-about-text');
  if (aboutEl) aboutEl.textContent=c.description;
  const img=document.querySelector('.purchase-img');
  if (img) {
    img.src=c.image||'img/default-image-course.png';
    img.alt=c.title;
  }
  const priceEl = document.querySelector('.course-price');
  if (priceEl) priceEl.textContent = (c.price && Number(c.price) > 0) ? `₴${c.price}` : 'Безкоштовно';
  const studentsEl = document.querySelector('.students-count');
  if (studentsEl) studentsEl.textContent=`${c.students_count} студентів`;
  const ratingsEl = document.querySelector('.ratings-info');
  if (ratingsEl) ratingsEl.textContent = Number(c.average_rating).toFixed(1);
  const starsEl = document.querySelector('.course-rating .stars');
  if (starsEl) starsEl.innerHTML = generateStars(Number(c.average_rating));
  const reviewsEl = document.querySelector('.reviews-count');
  if (reviewsEl) reviewsEl.textContent=`(${c.reviews_count} відгуків)`;
  updateCourseDetail('Рівень складності',translateLevel(c.level));
  updateCourseDetail('Тривалість',c.duration);
  updateCourseDetail('Мова',c.language);
  updateCourseDetail('Категорія',c.category);
  if(c.mentor_id)loadMentorDetails(c.mentor_id);
  loadCourseSyllabus(id);
}

async function loadCourseReviews(id){
  const r=await fetch(`${API_ROOT}/get_course_reviews.php?course_id=${id}`);
  const d=await r.json();
  if(d.error)return;
  displayCourseReviews(d);
}

function displayCourseReviews({reviews=[]}){
  const list=document.querySelector('.reviews-list');
  const btn=document.querySelector('.view-more-reviews-btn');
  if(!reviews.length){
    list.innerHTML='<p>Відгуків немає</p>';
    btn.style.display='none';
    return;
  }
  const s=calcStats(reviews);
  updateStats(s);
  list.innerHTML='';
  reviews.slice(0,3).forEach(r=>list.appendChild(makeReview(r)));
  if(reviews.length>3){
    btn.style.display='block';
    btn.onclick=()=>{
      list.innerHTML='';
      reviews.forEach(r=>list.appendChild(makeReview(r)));
      btn.style.display='none';
    };
  }
}

function calcStats(a){
  const total=a.length;
  const sum=a.reduce((s,r)=>s+r.rating,0);
  const dist={1:0,2:0,3:0,4:0,5:0};
  a.forEach(r=>dist[r.rating]++);
  return {average:sum/(total||1),total,dist};
}

function updateStats({average,total,dist}){
  document.querySelector('.review-average-score').textContent=average.toFixed(1);
  document.querySelector('.review-total').textContent=`На основі ${total} відгуків`;
  document.querySelectorAll('.review-bar').forEach((el,i)=>{
    const rt=5-i;
    const pct=total?dist[rt]/total*100:0;
    el.querySelector('.progress').style.width=`${pct}%`;
    el.querySelector('.review-percent').textContent=`${Math.round(pct)}%`;
  });
  document.querySelector('.reviews-average .stars').innerHTML=generateStars(average);
}

function makeReview(r){
  const d=new Date(r.date);
  const date=`${d.getDate()} ${getMonth(d.getMonth())} ${d.getFullYear()}`;
  const div=document.createElement('div');
  div.className='review-item';
  div.innerHTML=`
    <div class="review-header">
      <img src="${r.user_avatar}" class="review-avatar">
      <div>
        <div>${r.user_name}</div>
        <div>${date}</div>
      </div>
      <div class="stars">${generateStars(r.rating)}</div>
    </div>
    <div><p>${r.content}</p></div>`;
  return div;
}

function loadMentorDetails(id){
  fetch(`${API_ROOT}/get_mentor.php?id=${id}`)
    .then(r=>r.json())
    .then(m=>{
      if(m.error) return;
      const name = [m.first_name, m.last_name].filter(Boolean).join(' ').trim() || m.username || 'Невідомий автор';
      const nameEls = document.querySelectorAll('.instructor-name, .instructor-profile-name');
      nameEls.forEach(el => el.textContent = name);
      const titleEl = document.querySelector('.instructor-profile-title');
      if (titleEl) titleEl.textContent = m.title || '';
      const av = document.querySelector('.instructor-profile-avatar');
      if (av) av.src = m.avatar || av.src;
      const instructorSection = document.querySelector('#instructor');
      if (instructorSection) {
        const statValues = instructorSection.querySelectorAll('.stat-value');
        if (statValues[0]) statValues[0].textContent = `${m.students_count} студентів`;
        if (statValues[1]) statValues[1].textContent = `${m.reviews_count} відгуків`;
        if (statValues[2]) statValues[2].textContent = `${m.courses_count} курсів`;
      }
    });
}

function loadCourseSyllabus(id){
  fetch(`${API_ROOT}/get_course_syllabus.php?course_id=${id}`)
    .then(r=>r.json())
    .then(s=>{
      const sec=document.querySelector('.syllabus-sections');
      sec.innerHTML='';
      if(!s.sections.length)return sec.innerHTML='<p>Навчальний план відсутній</p>';
      document.getElementById('sections-count').textContent=s.sections.length;
      let totalLessons = 0;
      s.sections.forEach((sx,i)=>{
        totalLessons += sx.resources_count;
        sec.appendChild(makeSection(sx,i));
      });
      document.getElementById('lessons-count').textContent=totalLessons;
      attachSections();
    });
}

function makeSection(s,i){
  const d=document.createElement('div');
  d.className='syllabus-section';
  const resources=s.resources.map(r=>
    `<li><span class="resource-type">[${translateResourceType(r.type)}]</span> <span>${r.title}</span>${r.duration?` <span class="duration">(${r.duration} хв)</span>`:''}</li>`
  ).join('');
  d.innerHTML=`
    <div class="section-header">
      <div><strong>${s.title}</strong><div class="section-description">${s.description||''}</div></div>
      <div><span>${s.resources_count} уроків</span><img src="img/arrow-down.png" class="section-toggle"></div>
    </div>
    <ul class="section-resources">${resources}</ul>`;
  return d;
}

function attachSections(){
  document.querySelectorAll('.section-header').forEach(h=>h.onclick=()=>{
    const p=h.parentElement;
    p.classList.toggle('expanded');
  });
}

function translateResourceType(type) {
  switch(type) {
    case 'video': return 'Відео';
    case 'document': return 'Документ';
    case 'image': return 'Зображення';
    case 'text': return 'Текст';
    case 'quiz': return 'Тест';
    default: return type;
  }
}

function loadRelatedCourses(id){
  fetch(`${API_ROOT}/get_related_courses.php?course_id=${id}`)
    .then(r=>r.json())
    .then(d=>{
      const list=document.querySelector('.courses-list');
      list.innerHTML='';
      if (!d.courses || d.courses.length === 0) {
        list.innerHTML = '<p class="no-content">Схожих курсів не знайдено</p>';
        return;
      }
      d.courses.slice(0,4).forEach(c=>{
        const div=document.createElement('div');
        div.className='course-card';
        div.style.cursor = 'pointer';
        div.onclick = () => window.location.href = `course.html?id=${c.id}`;
        const image = c.image ? c.image : 'img/default-image-course.png';
        let author = 'Невідомий автор';
        if (c.first_name || c.last_name) {
          author = `${c.first_name ? c.first_name : ''} ${c.last_name ? c.last_name : ''}`.trim();
        } else if (c.author) {
          author = c.author;
        }
        const duration = c.duration ? `${c.duration} год.` : '';
        const level = c.level ? translateLevel(c.level) : '';
        div.innerHTML=`
          <img class="course-image" src="${image}" alt="${c.title}">
          <div class="course-details">
            <h3 class="course-title">${c.title}</h3>
            <p class="course-author">Автор: ${author}</p>
            <div class="course-rating">
              <div class="stars">${generateStars(Number(c.average_rating))}</div>
              <span class="ratings-info">${Number(c.average_rating).toFixed(1)}</span>
              <span class="reviews-count">(${c.reviews_count} відгуків)</span>
            </div>
            <div class="course-info">${duration} ${level}</div>
            <p class="course-price">₴${c.price}</p>
          </div>
        `;
        list.appendChild(div);
      });
    });
}

function generateStars(r){
  const f=Math.round(r), e=5-f;
  return '<img class="star" src="img/star.png">'.repeat(f)
       + '<img class="star" src="img/gstar.png">'.repeat(e);
}

function getMonth(m){
  return ['січня','лютого','березня','квітня','травня','червня','липня','серпня','вересня','жовтня','листопада','грудня'][m];
}

function translateLevel(l){
  return {beginner:'Початковий',intermediate:'Середній',advanced:'Просунутий',expert:'Експертний'}[l]||l;
}

function updateCourseDetail(lbl,val){
  document.querySelectorAll('.detail-label').forEach(dl=>{
    if(dl.textContent.includes(lbl))dl.nextElementSibling.textContent=val;
  });
}

document.addEventListener('scroll',()=>{
  const s=document.querySelectorAll('.course-section');
  const btn=document.querySelectorAll('.tab-btn');
  const y=window.scrollY;
  let cur;
  s.forEach(sec=>{const t=sec.offsetTop-100; if(y>=t&&y< t+sec.offsetHeight)cur=sec.id;});
  btn.forEach(b=>b.classList.toggle('active',b.getAttribute('href').slice(1)===cur));
});
