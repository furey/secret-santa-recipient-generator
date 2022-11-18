require('dotenv').config()

const _ = require('lodash')
const fs = require('fs-extra')

const run = async () => {
  let restart = true
  while (restart) {
    restart = false
    const participants = getParticipants()
    prefillGettingFrom(participants)
    let i = 0
    while (withoutGettingFrom(participants).length && !restart) {
      try {
        const [getter] = _.sample(withoutGettingFrom(participants))
        const [giver] = _.sample(withoutGivingTo(participants, getter))
        participants[getter].gettingFrom = giver
        participants[giver].givingTo = getter
        i++
        console.debug(`Iteration ${i}:`)
        console.debug(participants)
      } catch (e) {
        console.debug(`An error occured while assigning recipients ("${e.message}").`)
        console.debug('Restarting…')
        restart = true
      }
    }
    console.table(participants)
  }
}

console.debug = (...arguments) => {
  if (process.env.LOG_LEVEL === 'debug') console.log(...arguments)
}

const getParticipants = () => {
  const { PARTICIPANTS_PATH } = process.env
  if (!fs.pathExistsSync(PARTICIPANTS_PATH)) throw new Error ('PARTICIPANTS_PATH does not exist.')
  const source = fs.readJsonSync(PARTICIPANTS_PATH)
  if (!source || !Object.entries(source).length) throw new Error('PARTICIPANTS_PATH content invalid.')
  return _.mapValues(source, options => ({ givingTo: options?.givingTo, gettingFrom: undefined }))
}

const prefillGettingFrom = participants => {
  Object.entries(participants).forEach(participantEntry => {
    const [ name, actions ] = participantEntry
    if (!actions.givingTo) return
    if (!participants[actions.givingTo]) throw new Error (`Participant [${[actions.givingTo]}] does not exist.`)
    participants[actions.givingTo].gettingFrom = name
  })
}

const withoutGettingFrom = participants =>
  Object.entries(participants)
    .filter(participantEntry => !participantEntry[1].gettingFrom)

const withoutGivingTo = (participants, excludingParticipant = undefined) =>
  Object.entries(participants)
    .filter(participantEntry => !participantEntry[1].givingTo && participantEntry[0] !== excludingParticipant)

const onError = e => {
  console.log(e)
  console.log('Exiting…')
  process.exit(1)
}

run().catch(onError)
