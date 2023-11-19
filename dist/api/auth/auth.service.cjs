"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Cryptr = require('cryptr');
const bcrypt = require('bcrypt');
const userService = require('../user/user.service.cjs');
const logger_service_cjs_1 = require("../../services/logger.service.cjs");
const cryptr = new Cryptr(process.env.SECRET1 || 'Secret-Puk-1234');
async function login(username, password) {
    console.log('username of login:', username);
    console.log('password of login:', password);
    logger_service_cjs_1.loggerService.debug(`auth.service - login with username: ${username}`);
    const user = await userService.getByUsername(username);
    if (!user)
        return Promise.reject('Invalid username or password');
    // TODO: un-comment for real login
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const match = await bcrypt.compare(password, hashedPassword);
    // const match = await bcrypt.compare(password, user.password)
    if (!match)
        return Promise.reject('Invalid username or password');
    delete user.password;
    return user;
}
async function signup(username, password, fullname, imgUrl = null) {
    const saltRounds = 10;
    console.log('username', username);
    logger_service_cjs_1.loggerService.debug(`auth.service - signup with username: ${username}, fullname: ${fullname}`);
    if (!username || !password || !fullname)
        return Promise.reject('fullname, username and password are required!');
    const hash = await bcrypt.hash(password, saltRounds);
    return userService.add({ username, password: hash, fullname, imgUrl });
}
function getLoginToken(user) {
    const userInfo = {
        _id: user._id,
        fullname: user.fullname,
        isAdmin: user.isAdmin,
    };
    return cryptr.encrypt(JSON.stringify(userInfo));
}
function validateToken(loginToken) {
    try {
        const json = cryptr.decrypt(loginToken);
        const loggedinUser = JSON.parse(json);
        return loggedinUser;
    }
    catch (err) {
        console.log('Invalid login token');
    }
    return null;
}
module.exports = {
    signup,
    login,
    getLoginToken,
    validateToken,
};
//# sourceMappingURL=auth.service.cjs.map