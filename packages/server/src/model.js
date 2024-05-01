const { v4 : uuidv4 } = require('uuid')
const util = require('util');

const { client } = require('./redis.js');

const { makeQuestion,
    makeMarkedQuestion, } = require('./messages.js');

const { chooseRandomly } = require('./utils.js');

const { questions,
    adultQuestions, } = require('./questions.js');

const { logger } = require('./logger.js');


const RETIRE_TIMEOUT = 60; // seconds

// List
class Queue {
    constructor(handleNewRoom) {
        setInterval(async () => {
            this.tryGetRoom('normal', handleNewRoom);
            this.tryGetRoom('adult', handleNewRoom);
        }, 1000);
    }

    async tryGetRoom(gameMode, handleRoom) {
        const prefix = gameMode === 'normal' ? 'n' : 'a';

        // male-female
        const mfQueue = `chatqueue_${prefix}_mf`;
        const fmQueue = `chatqueue_${prefix}_fm`;
        const nMfEnqueued = await client.lLen(mfQueue);
        const nFmEnqueued = await client.lLen(fmQueue);

        if (nMfEnqueued > 0 && nFmEnqueued > 0) {
            const users = [
                (await client.lPop(mfQueue)),
                (await client.lPop(fmQueue)),
            ].map(id => new User(id));

            users.forEach(user => client.del(`user:${user.id}:queue`));
            const room = await RoomManager.create(users, gameMode);

            handleRoom(room);
        }

        // male-male, female-female, unspecified-unspecified
        ['ff', 'mm', 'uu'].forEach(async suffix => {
            const queueName = `chatqueue_${prefix}_${suffix}`;
            if ((await client.lLen(queueName)) > 1) {
                const users = (await client.lPopCount(queueName, 2)).map(id => new User(id));

                users.forEach(user => client.del(`user:${user.id}:queue`));
                const room = await RoomManager.create(users, gameMode);

                handleRoom(room);
            }
        });
    }

    // async
    async isEnqueued(user) {
        const result = !!(await client.get(`user:${user.id}:queue`));
        return result;
    }

    // mode = normal | adult
    // gender = male | female | unspecified
    // searchGender = female | gender (works only if gender === male | female)
    push(user, { adultMode = false, gender = 'unspecified', searchGender } = {}) {
        let queueName = 'chatqueue_';

        queueName += adultMode  ? 'a_' : 'n_';

        if (gender === 'unspecified') {
            queueName += 'uu';
        } else {
            queueName += gender === 'male' ? 'm' : 'f';
            queueName += searchGender === 'female' ? 'f' : 'm';
        }

        client.lPush(queueName, user.id);
        client.set(`user:${user.id}:queue`, queueName);
    }

    async remove(user) {
        const key = `user:${user.id}:queue`;

        const queueName = await client.get(key);

        if (queueName) {
            client.lRem(queueName, 0, user.id);
            client.del(key);

            return true;
        } 
        return false;
    }
}

// ID
// online users: list
class User {
    id

    constructor(id) {
        this.id = id
    }

    static createId() {
        return uuidv4()
    }

    static async getAllOnline() {
        const userids = await client.sMembers('online_users');
        return userids.map(id => new User(id));
    }

    equals(user) {
        return this.id === user.id
    }

    // async
    get online() {
        return client.sIsMember('online_users', this.id)
    }

    set online(status) {
        if (status) {
            client.sAdd('online_users', this.id)
        } else {
            client.sRem('online_users', this.id)
        }
    }

    // async
    get room() {
        const getRoom = async() => {
            const roomId = await client.get(`user:${this.id}:room`)
            return roomId ? new Room(roomId) : null
        }
        return getRoom()
    }

    leaveRoom() {
        client.del(`user:${this.id}:room`)
    }
}

class RoomManager {
    static async create(users, gameMode) {
        const [ userA, userB ] = users
        const roomId = userA < userB ?
            `${userA.id}:${userB.id}` : 
            `${userB.id}:${userA.id}`

        // TODO: fail
        const multi = client.multi();

        const room = new Room(roomId);
        const game = new Game(roomId);

        // clear previous room
        room.clear(multi);
        game.clear(multi);

        room.init(multi);
        game.init(gameMode, multi);

        await multi.exec();

        return room;
    }

    static retire(room, retireTimeout) {
        const game = room.game;
        const multi = client.multi();

        room.retire(multi, retireTimeout || RETIRE_TIMEOUT);
        game.retire(multi, retireTimeout || RETIRE_TIMEOUT);

        multi.exec();
    }
}

class Messages {
    key;

    constructor(key) {
        this.key = key;
    }

    clear(multi) {
        multi
            .del(this.key);
    }

    retire(multi, timeout=60) {
        const myMulti = multi ? multi : client.multi();

        myMulti
            .expire(this.key, timeout)

        return multi ? myMulti : myMulti.exec();
    }

    async getList(page=0) {
        const range = 50;
        const offset = page*range;
        return (await client.zRange(this.key, offset, offset+range-1, { REV: true }))
            .map(msg => this.creator ? 
                this.creator(JSON.parse(msg)) 
                : JSON.parse(msg));
    }

    async getLast() {
        const res = await client.zRange(this.key, 0, 1, { REV: true });
        return res.length ? JSON.parse(res[0]) : null;
    }

    async getNumber() {
        return await client.zCard(this.key);
    }

    // TODO: fail (?)
    async save(message) {
        client.zAdd(this.key, {
            score: message.dt, 
            value: JSON.stringify(message)
        });
    }

    // TODO: fail (?)
    async replace(message, replacement) {
        // both zRem and zAdd are O(logN) 
        const results = await client
            .multi()
            .zRem(this.key, JSON.stringify(message)) 
            .zAdd(this.key, { 
                score: replacement.dt,
                value: JSON.stringify(replacement)
            })
            .exec();
    }
}

class Room {
    id

    constructor(id) {
        this.id = id
    }

    equals(room) {
        return room && this.id === room.id
    }

    init(multi) {
        const myMulti = multi ? multi : client.multi();

        const [ userA, userB ] = this.id.split(':');

        myMulti
            .set(`user:${userA}:room`, this.id)
            .set(`user:${userB}:room`, this.id);

        return multi ? myMulti : myMulti.exec();
    }

    clear(multi) {
        const myMulti = multi ? multi : client.multi();
        this.messages.clear(myMulti);
        return multi ? myMulti : myMulti.exec();
    }

    // timeout = seconds
    retire(multi, timeout=60) {
        const myMulti = multi ? multi : client.multi();
        const userids = this.id.split(':');

        myMulti
            .expire(`user:${userids[0]}:room`, timeout)
            .expire(`user:${userids[1]}:room`, timeout);
        this.messages.retire(myMulti, timeout);

        return multi ? myMulti : myMulti.exec();
    }

    // async
    get isActive() {
        const _isActive = async () => {
            const userARoom = await this.users[0].room;
            const userBRoom = await this.users[1].room;
            return this.equals(userARoom) && this.equals(userBRoom);
        }

        return _isActive();
    }

    // room ids are formed after the pattern smallerUserId:userId
    get users() {
        return this.id.split(':').map(userId => new User(userId));
    }

    get game() {
        return new Game(this.id);
    }

    get messages() {
        return new Messages(`room:${this.id}`);
    }
}

// Game

class Game {
    id

    constructor(id) {
        this.id = id
    }

    init(mode, multi) {
        const myMulti = multi ? multi : client.multi();

        myMulti
            .set(`game:${this.id}`, mode);

        return multi ? myMulti : myMulti.exec();
    }

    retire(multi, timeout=60) {
        const myMulti = multi ? multi : client.multi();

        myMulti
            .expire(`game:${this.id}`, timeout)
        this.questions.retire(myMulti, timeout);

        return multi ? myMulti : myMulti.exec();
    }

    clear(multi) {
        const myMulti = multi ? multi : client.multi();

        myMulti
            .del(`game:${this.id}`);
        this.questions.clear(myMulti);

        return multi ? myMulti : myMulti.exec();
    }

    async nextQuestion() {
        const myQuestions = this.questions;
        const lastQuestion = await myQuestions.getLast();

        if (lastQuestion && !lastQuestion.answered) {
            logger.log({ level: 'warn', message: 'Game.nextQuestion: there is an active question' });
            return null;
        }

        const mode = await this.mode;
        const users = (new Room(this.id)).users;
        const asker = chooseRandomly(users);
        const text = chooseRandomly(mode === 'adult' ? adultQuestions : questions);

        const question = makeQuestion(text, asker);
        myQuestions.save(question);

        return question;
    }

    async acceptQuestion(user) {
        const myQuestions = this.questions;
        const lastQuestion = await myQuestions.getLast();

        if (!lastQuestion || lastQuestion.answered) {
            logger.log({ level: 'warn', message: 'Game.acceptQuestion: there is no active question' });
            return null;
        }

        const asker = new User(lastQuestion.sender);

        if (!user.equals(asker)) {
            logger.log({ level: 'warn', message: 'Game.acceptQuestion: wrong user trying to accept the question' });
            return null;
        }

        const newQuestion = makeMarkedQuestion(lastQuestion);
        myQuestions.replace(lastQuestion, newQuestion);

        return newQuestion;
    }

    // async
    get mode() {
        const getMode = async () => {
            const modeName = await client.get(`game:${this.id}`);
            return modeName;
        };

        return getMode();
    }

    get questions() {
        return new Messages(`game:${this.id}:questions`);
    }
}

module.exports = {
    Queue: Queue,
    User: User,
    Room: Room,
    Game: Game,
    RoomManager: RoomManager,
}
