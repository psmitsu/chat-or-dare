const { client, connect } = require('../redis.js')
const { Queue, User } = require('../model.js')


const init = async () => {
    await connect();
    await client.flushDb();

    // male users
    let m1 = new User('m1');
    // female users
    let f1 = new User('f1');

    const q = new Queue(async (room) => {
        const game = room.game;
        console.log(`room: ${room.id} is ${(await room.isActive) ? 'active' : 'inactive'} game mode: ${(await game.mode)}`);

        let q = await game.nextQuestion();
        let u = new User(q.sender);
        await game.acceptQuestion(u);

        q = await game.nextQuestion();
        u = new User(q.sender);
        await game.acceptQuestion(u);

        q = await game.nextQuestion();
        u = new User(q.sender);
        await game.acceptQuestion(u);

        const questions = game.questions;
        const qList = await questions.getMessages();
        console.log(qList);
    });

    q.push(m1, { adultMode: true, gender: 'male', searchGender: 'female'});

    q.push(f1, { adultMode: true, gender: 'female', searchGender: 'male'});
}

init();
