// null, undefined, ' ' 체크
const isEmpty = (name, x) => {
    // x가 null이거나 undefined / trim한 결과가 ''일 때
    if (x == null || x == undefined || x.trim().length == 0) {
        const error = new Error(`${name} is empty.`);
        error.statusCode = 400;
        throw error;
    } else return true;
};

// 길이 체크하는 함수 추가하기
const checkLength = (name, x, max = Infinity, min = 0) => {
    if (x.length > max) {
        const error = new Error(`${name} is too long.`);
        error.statusCode = 400;
        throw error;
    } else if (x.length > min) {
        const error = new Error(`${name} is too short.`);
        error.statusCode = 400;
        throw error;
    } else return true;
};

module.exports = { isEmpty, checkLength };
