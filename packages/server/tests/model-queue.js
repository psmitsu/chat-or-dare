const { client, connect } = require('../redis.js')
const { Queue, User } = require('../model.js')


const init = async () => {
    await connect();
    await client.flushDb();

    // male users
    let m1 = new User('m1');
    // female users
    let f1 = new User('f1');
    let f2 = new User('f2');
    let f3 = new User('f3');
    // unknown users
    let u1 = new User('u1');
    let u2 = new User('u2');
    // queue removal test user
    let m2 = new User('m2');

    const q = new Queue(async (room) => {
        const game = room.game;
        console.log(`room: ${room.id} game mode: ${(await game.mode)}`);
    });

    q.push(m1, { adultMode: true, gender: 'male', searchGender: 'female'});

    q.push(f1, { adultMode: true, gender: 'female', searchGender: 'male'});
    q.push(f2, { gender: 'female', searchGender: 'female'});
    q.push(f3, { gender: 'female', searchGender: 'female'});

    q.push(u1, { gender: 'unspecified' });
    q.push(u2, { gender: 'unspecified' });

    q.push(m2, { gender: 'male', searchGender: 'female'});

    // test isEnqued
    setTimeout(async () => {
        const m2Enqeued = await q.isEnqueued(m2);
        console.log(m2Enqeued);
        q.remove(m2);

        setTimeout(async () => {
            const m2Enqeued2 = await q.isEnqueued(m2);
            console.log(m2Enqeued2);
        }, 1000);
    }, 1000);
};

init()
