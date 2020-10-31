const config = require('../config')

const knex = require('knex')({
    client: 'pg',
    connection: config.DATABASE_URL,
  });


module.exports.knex = knex

module.exports.getFreePhoneNumberList = async () => {
    const freePhoneNumberList = await knex('phoneNumbers').select()
      .where('freeAt', '<', knex.fn.now());
    return freePhoneNumberList
}

module.exports.bookNextFreePhoneNumber = async () => {
    const freeAt = new Date(new Date().getTime() + config.CONFERENCE_DURATION_IN_MINUTES * 60000)
    try {
        const freePhoneNumbers = await knex('phoneNumbers').select()
            .where('freeAt', '<', knex.fn.now())
            .orderBy('freeAt', 'desc')
            .limit(1)

        const freePhoneNumberData = freePhoneNumbers[0]
        if(!freePhoneNumberData)
            throw new Error(`Nous n'avons plus de conférences disponibles.`)
        //TODO : Manage concurrency
        const freePhoneNumberDataUpdated = await knex('phoneNumbers')
            .update({'freeAt': freeAt})
            .increment('used', 1)
            .where({ 'phoneNumber': freePhoneNumberData.phoneNumber })
            .where('freeAt', '<', knex.fn.now())
            .returning('*')
        return freePhoneNumberDataUpdated[0]
    } catch(err) {
        console.log("bookNextFreePhoneNumber error",err)
        throw new Error(`Impossible de d'obtenir un numéro de conférence.`)
    }
}

module.exports.insertPhoneNumber = async (phoneNumber) => {
    const dbPhoneNumbers = await knex('phoneNumbers').select()
        .where({ phoneNumber: phoneNumber })
    if(dbPhoneNumbers.length === 0) {
        return knex('phoneNumbers').insert({
            phoneNumber: phoneNumber
        });
    } else {
        return null
    }
}

module.exports.insertToken = async (email, token, expirationDate) => {
    try {
      return await knex('loginTokens').insert({
        token,
        email,
        expiresAt: expirationDate,
      });
    } catch (err) {
      console.error(`Erreur de sauvegarde du token : ${err}`);
      throw new Error('Erreur de sauvegarde du token');
    }
}

module.exports.getToken = async (token) => {
    try {
       return await knex('loginTokens').select()
        .where({ token: token })
        .andWhere('expiresAt', '>', new Date())
        .del()
        .returning("*")
    } catch (err) {
      console.error(`Impossible de récupérer le token : ${err}`);
      throw new Error('Impossible de récupérer le token');
    }
}
