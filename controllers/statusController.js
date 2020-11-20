/*
GET /status
code 200 -> tout va bien
code 500 -> erreur
*/
module.exports.getStatus = async (req, res) => {
  // todo : tester la connexion à la base de donnée
  // todo : tester la connexion à OVH
  res.status(200).json({ message: 'OK' })
}