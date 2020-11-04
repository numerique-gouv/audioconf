const config = require('../config')

const knex = require('knex')({
    client: 'pg',
    connection: config.DATABASE_URL,
  });


module.exports.knex = knex

module.exports.getPhoneNumberList = async () => {
    try {
      const freePhoneNumberList = await knex('phoneNumbers').select()
        .orderBy('freeAt', 'asc');
      return freePhoneNumberList
    } catch(err) {
        console.error('getPhoneNumberList error',err)
        throw new Error(`Impossible de d'obtenir un numéro de conférence.`)
    }
}

module.exports.bookNextFreePhoneNumber = async (durationInMinutes) => {
    const now = new Date()
    const freeAt = new Date(now.setMinutes(now.getMinutes() + durationInMinutes))
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
        console.error('bookNextFreePhoneNumber error',err)
        throw new Error(`Impossible de d'obtenir un numéro de conférence.`)
    }
}

module.exports.releasePhoneNumber = async (phoneNumber) => {
    try {
        return await knex('phoneNumbers')
            .update({'freeAt': knex.fn.now()})
            .where({ 'phoneNumber': phoneNumber })
            .where('freeAt', '>', knex.fn.now())
            .returning('*')
    } catch(err) {
        console.error('releasePhoneNumber error', err)
        throw new Error(`Impossible de libérer le numéro de conférence.`)
    }
}


module.exports.insertPhoneNumber = async (phoneNumber) => {
    try {
        const dbPhoneNumbers = await knex('phoneNumbers').select()
            .where({ phoneNumber: phoneNumber })

        if (dbPhoneNumbers.length === 0) {
            return knex('phoneNumbers').insert({
                phoneNumber: phoneNumber
            });
        } else {
            return null
        }
    } catch(err) {
        console.error('insertPhoneNumber error', err)
        throw new Error(`Impossible d'insérer le numéro de conférence.`)
    }
}

module.exports.insertConference = async (email, phoneNumber, durationInMinutes, expiresAt) => {
    try {
        return (await knex('conferences').insert({
          email,
          phoneNumber,
          durationInMinutes,
          expiresAt,
        }).returning("*"))[0];
    } catch (err) {
        console.error(`Erreur de sauvegarde de la conférence`, err)
        throw new Error('Erreur de sauvegarde de la conférence')
    }
}

module.exports.getConference = async (id) => {
    try {
        const conferences = await knex('conferences').select()
            .where({ id: id })
        return conferences[0]
    } catch (err) {
      console.error(`Impossible de récupérer la conférence ${id}`, err)
      throw new Error('Impossible de récupérer la conférence')
    }
}

module.exports.getUnexpiredConference = async (id) => {
    try {
        const conferences = await knex('conferences').select()
            .where({ id: id })
            .andWhere('expiresAt', '>', new Date())
        return conferences[0]
    } catch (err) {
      console.error(`Impossible de récupérer la conférence ${id}`, err)
      throw new Error('Impossible de récupérer la conférence')
    }
}

module.exports.cancelConference = async (id) => {
    try {
        const updatedConference = (await knex('conferences')
            .where({ id: id })
            .update({ canceledAt: knex.fn.now() })
            .returning("*"))[0]

        await module.exports.releasePhoneNumber(updatedConference.phoneNumber)
        return conference
    } catch (err) {
        console.error(`Impossible d'annuler la conférence ${id}`, err)
        throw new Error('Impossible d\'annuler la conférence')
    }
}

module.exports.insertToken = async (email, token, durationInMinutes, expirationDate) => {
    try {
      return await knex('loginTokens').insert({
        token,
        email,
        durationInMinutes,
        expiresAt: expirationDate,
      });
    } catch (err) {
      console.error(`Erreur de sauvegarde du token`, err)
      throw new Error('Erreur de sauvegarde du token')
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
      console.error(`Impossible de récupérer le token`, err)
      throw new Error('Impossible de récupérer le token')
    }
}
