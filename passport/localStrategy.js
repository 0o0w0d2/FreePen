// LocalStrategy 인증

const passport = require('passport');
const LocalStrategy = require('passport-local');
const bcrypt = require('bcrypt');

module.exports = () => {
    passport.use(
        new LocalStrategy(async (username, pw, cb) => {
            try {
                const user = await db
                    .collection('user')
                    .findOne({ username: username });
                if (user) {
                    const result = await bcrypt.compare(pw, user.password);

                    if (result) {
                        cb(null, user);
                    } else {
                        cb(null, false, {
                            message: '비밀번호가 일치하지 않습니다.',
                        });
                    }
                } else {
                    cb(null, false, { message: '해당 ID를 찾을 수 없습니다.' });
                }
            } catch (err) {
                console.log(err);
                cb(err);
            }
        }),
    );
};
