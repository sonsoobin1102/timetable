// 강의 저장소
let classList = [];

// 1시간 단위 시간 슬롯 (9:00 ~ 17:00)
const timeSlots = [
    '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'
];

// DOM 요소
const classForm = document.getElementById('class-form');
const classNameInput = document.getElementById('class-name');
const classRoomInput = document.getElementById('class-room');
const classTimeSelect = document.getElementById('class-time');
const classDurationSelect = document.getElementById('class-duration');
const classListDiv = document.getElementById('class-list');
const scheduleGrid = document.getElementById('schedule-grid');

// 페이지 로드 시 저장된 데이터 불러오기
document.addEventListener('DOMContentLoaded', () => {
    loadClassesFromStorage();
    initScheduleGrid();
    updateScheduleDisplay();
});

// 시간표 그리드 초기화
function initScheduleGrid() {
    scheduleGrid.innerHTML = '';
    
    // 헤더 행
    const headerTime = document.createElement('div');
    headerTime.className = 'time-slot header';
    headerTime.textContent = '시간';
    scheduleGrid.appendChild(headerTime);
    
    for (let i = 0; i < 4; i++) {
        const header = document.createElement('div');
        header.className = 'time-slot header';
        header.textContent = `강의실 ${i + 1}`;
        scheduleGrid.appendChild(header);
    }
    
    // 시간 슬롯
    timeSlots.forEach((time) => {
        const timeCell = document.createElement('div');
        timeCell.className = 'time-slot';
        timeCell.textContent = time;
        scheduleGrid.appendChild(timeCell);
        
        for (let i = 0; i < 4; i++) {
            const cell = document.createElement('div');
            cell.className = 'time-slot empty';
            cell.id = `slot-${time}-${i}`;
            scheduleGrid.appendChild(cell);
        }
    });
}

// 폼 제출 이벤트
classForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // 입력값 가져오기
    const courseName = classNameInput.value.trim();
    const courseRoom = classRoomInput.value.trim();
    const courseTime = parseInt(classTimeSelect.value);
    const courseDuration = parseInt(classDurationSelect.value);
    
    // 유효성 검사
    if (!courseName || !courseRoom || !courseTime || !courseDuration) {
        alert('모든 필드를 입력해주세요.');
        return;
    }
    
    // 시작 시간 (분)
    const startMinutes = (courseTime - 1) * 60 + 9 * 60;
    const endMinutes = startMinutes + courseDuration;
    
    // 시간 충돌 감지
    const conflict = classList.find(course => {
        const courseStartMin = (course.classNumber - 1) * 60 + 9 * 60;
        const courseEndMin = courseStartMin + course.duration;
        
        // 겹치는 지 확인
        return !(endMinutes <= courseStartMin || startMinutes >= courseEndMin);
    });
    
    if (conflict) {
        alert(`⚠️ 시간이 겹칩니다!\n\n기존 강의: "${conflict.name}" (${getTimeDisplay(conflict)})\n\n다른 시간을 선택해주세요.`);
        return;
    }
    
    // 새 강의 객체 생성
    const newClass = {
        id: Date.now(),
        name: courseName,
        room: courseRoom,
        classNumber: courseTime,
        duration: courseDuration,
        startTime: getTimeFromClassNumber(courseTime),
        room_idx: classList.filter(c => c.classNumber === courseTime).length % 4
    };
    
    // 저장
    classList.push(newClass);
    saveClassesToStorage();
    updateScheduleDisplay();
    updateClassList();
    classForm.reset();
    
    alert('강의가 등록되었습니다!');
});

// 시간 표시 함수
function getTimeDisplay(course) {
    const startTime = getTimeFromClassNumber(course.classNumber);
    const endMin = (course.classNumber - 1) * 60 + 9 * 60 + course.duration;
    const endHour = Math.floor(endMin / 60);
    const endMin_ = endMin % 60;
    const endTime = `${String(endHour).padStart(2, '0')}:${String(endMin_).padStart(2, '0')}`;
    return `${startTime}~${endTime} (${course.duration}분)`;
}

// 교시 번호로 시간 문자열 반환
function getTimeFromClassNumber(classNum) {
    const baseHour = 9;
    const hour = baseHour + (classNum - 1);
    return `${String(hour).padStart(2, '0')}:00`;
}

// 시간표에 강의 표시하기
function updateScheduleDisplay() {
    // 모든 셀 초기화
    timeSlots.forEach((time) => {
        for (let i = 0; i < 4; i++) {
            const cell = document.getElementById(`slot-${time}-${i}`);
            cell.className = 'time-slot empty';
            cell.innerHTML = '';
        }
    });
    
    // 각 강의를 시간표에 추가
    classList.forEach((course) => {
        const startMinutes = (course.classNumber - 1) * 60 + 9 * 60;
        const durationSlots = Math.ceil(course.duration / 60);
        
        let slotIndex = 0;
        for (let i = 0; i < timeSlots.length; i++) {
            const timeStr = timeSlots[i];
            const [hour, min] = timeStr.split(':').map(Number);
            const timeMinutes = hour * 60 + min;
            
            if (timeMinutes >= startMinutes && timeMinutes < startMinutes + course.duration) {
                const cell = document.getElementById(`slot-${timeStr}-${course.room_idx}`);
                
                if (cell && slotIndex === 0) {
                    // 첫 번째 셀에만 내용 표시
                    cell.className = 'time-slot occupied';
                    cell.style.gridRow = `span ${durationSlots}`;
                    cell.innerHTML = `
                        <div class="schedule-course">
                            <div style="font-weight: 600; margin-bottom: 4px;">${course.name}</div>
                            <div style="font-size: 0.75em; color: #666;">${course.room}</div>
                            <div style="font-size: 0.75em; color: #999; margin-top: 2px;">${getTimeDisplay(course)}</div>
                        </div>
                    `;
                } else if (cell && slotIndex > 0) {
                    cell.className = 'time-slot occupied';
                    cell.style.display = 'none';
                }
                slotIndex++;
            }
        }
    });
}

// 등록된 강의 목록 업데이트
function updateClassList() {
    classListDiv.innerHTML = '';
    
    if (classList.length === 0) {
        classListDiv.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #999; padding: 20px;">등록된 강의가 없습니다.</p>';
        return;
    }
    
    classList.forEach((course) => {
        const classItem = document.createElement('div');
        classItem.className = 'class-item';
        classItem.innerHTML = `
            <div class="class-item-header">
                <div class="class-item-name">${course.name}</div>
                <button class="btn-delete" onclick="deleteClass(${course.id})">삭제</button>
            </div>
            <div class="class-item-detail">
                <strong>강의실:</strong> ${course.room}
            </div>
            <div class="class-item-detail">
                <strong>시간:</strong> ${course.classNumber}교시 (${getTimeDisplay(course)})
            </div>
            <div class="class-item-detail">
                <strong>수업시간:</strong> ${course.duration}분
            </div>
        `;
        classListDiv.appendChild(classItem);
    });
}

// 강의 삭제
function deleteClass(id) {
    const courseIndex = classList.findIndex(course => course.id === id);
    if (courseIndex > -1) {
        const courseName = classList[courseIndex].name;
        if (confirm(`"${courseName}" 강의를 삭제하시겠습니까?`)) {
            classList.splice(courseIndex, 1);
            saveClassesToStorage();
            updateScheduleDisplay();
            updateClassList();
        }
    }
}

// LocalStorage에 저장
function saveClassesToStorage() {
    localStorage.setItem('classList', JSON.stringify(classList));
}

// LocalStorage에서 불러오기
function loadClassesFromStorage() {
    const saved = localStorage.getItem('classList');
    if (saved) {
        try {
            classList = JSON.parse(saved);
            updateClassList();
        } catch (e) {
            console.error('데이터 로드 오류:', e);
            classList = [];
        }
    }
}
