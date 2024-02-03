// 로그인한 상태
const isLogin = (req, res, next) => {
    if (req.isAuthenticated()) {
        next();
    } else {
        res.status(403).send({ message: '로그인을 확인해주세요.' });
    }
};

// 로그인안한 상태
const isNotLogin = (req, res, next) => {
    if (!req.isAuthenticated()) {
        next();
    } else {
        res.redirect('/post/list/1');
    }
};

module.exports = { isLogin, isNotLogin };
