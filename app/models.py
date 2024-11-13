from . import db

class Abteilung(db.Model):
    __tablename__ = 'abteilung'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), unique=True, nullable=False)

class Ziele(db.Model):
    __tablename__ = 'ziele'
    id = db.Column(db.Integer, primary_key=True)
    abteilung_id = db.Column(db.Integer, db.ForeignKey('abteilung.id'), nullable=False)
    aussage = db.Column(db.Text, nullable=False)
    kriterien = db.Column(db.Text, nullable=False)
    bewertung = db.Column(db.Integer, nullable=False)
    einschaetzung = db.Column(db.Text)
    letzte_aenderung = db.Column(db.Date)
    geaendert_von = db.Column(db.String(255))
    kommentar = db.Column(db.Text)

    abteilung = db.relationship('Abteilung', backref='ziele')

class Historie(db.Model):
    __tablename__ = 'historie'
    id = db.Column(db.Integer, primary_key=True)
    ziel_id = db.Column(db.Integer, db.ForeignKey('ziele.id'), nullable=False)
    aenderung_datum = db.Column(db.Date, nullable=False)
    bewertung = db.Column(db.Integer, nullable=False)
    kommentar = db.Column(db.Text)
    geaendert_von = db.Column(db.String(255))

    ziel = db.relationship('Ziele', backref='historie')
