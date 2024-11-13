from datetime import date

from flask import jsonify, request, render_template, current_app as app
from . import db
from .models import Ziele, Historie, Abteilung
from sqlalchemy import func

# Render the main page
@app.route('/')
def index():
    return render_template('index.html')


# Create a new goal
@app.route('/goals', methods=['POST'])
def create_goal():
    data = request.json

    # Validate if the `abteilung_id` exists in the Abteilung table
    if not Abteilung.query.get(data['abteilung_id']):
        return jsonify({"error": "Invalid department ID (abteilung_id)"}), 400

    # Create the new goal
    new_goal = Ziele(
        abteilung_id=data['abteilung_id'],
        aussage=data['aussage'],
        kriterien=data['kriterien'],
        bewertung=data['bewertung'],
        einschaetzung=data.get('einschaetzung'),
        letzte_aenderung=data.get('letzte_aenderung'),
        geaendert_von=data.get('geaendert_von'),
        kommentar=data.get('kommentar')
    )

    # Add to session and commit to database
    db.session.add(new_goal)
    db.session.commit()
    return jsonify({'message': 'Goal created successfully'}), 201


# Get all goals
@app.route('/goals', methods=['GET'])
def get_goals():
    goals = Ziele.query.all()
    goals_data = [{
        "id": goal.id,
        "abteilung_id": goal.abteilung_id,
        "aussage": goal.aussage,
        "kriterien": goal.kriterien,
        "bewertung": goal.bewertung,
        "einschaetzung": goal.einschaetzung,
        "letzte_aenderung": goal.letzte_aenderung,
        "geaendert_von": goal.geaendert_von,
        "kommentar": goal.kommentar
    } for goal in goals]
    return jsonify(goals_data)


# Update a goal
@app.route('/goals/<int:goal_id>', methods=['PUT'])
def update_goal(goal_id):
    goal = Ziele.query.get(goal_id)
    if not goal:
        return jsonify({'error': 'Goal not found'}), 404

    # Get the current data before making any changes (for history tracking)
    previous_bewertung = goal.bewertung
    previous_kommentar = goal.kommentar
    previous_geaendert_von = goal.geaendert_von or "Unknown"

    # Get updated data from the request
    data = request.json
    goal.aussage = data.get('aussage', goal.aussage)
    goal.kriterien = data.get('kriterien', goal.kriterien)
    goal.bewertung = data.get('bewertung', goal.bewertung)
    goal.einschaetzung = data.get('einschaetzung', goal.einschaetzung)
    goal.letzte_aenderung = data.get('letzte_aenderung', date.today())  # default to today's date
    goal.geaendert_von = data.get('geaendert_von', "User")  # replace "User" with actual username if available
    goal.kommentar = data.get('kommentar', goal.kommentar)

    # Create a history entry with the previous values
    history_entry = Historie(
        ziel_id=goal.id,
        aenderung_datum=date.today(),
        bewertung=previous_bewertung,
        kommentar=previous_kommentar,
        geaendert_von=previous_geaendert_von
    )

    # Add the history entry to the session
    db.session.add(history_entry)

    # Commit both the history entry and the updated goal
    db.session.commit()

    return jsonify({'message': 'Goal updated successfully'})


# Get goal history
@app.route('/goals/<int:goal_id>/history', methods=['GET'])
def get_goal_history(goal_id):
    history = Historie.query.filter_by(ziel_id=goal_id).all()
    history_data = [{
        "aenderung_datum": entry.aenderung_datum.strftime('%Y-%m-%d'),
        "bewertung": entry.bewertung,
        "kommentar": entry.kommentar,
        "geaendert_von": entry.geaendert_von
    } for entry in history]
    return jsonify(history_data)



# Average Scores Endpoint for graphical analysis
@app.route('/average_scores', methods=['GET'])
def average_scores():
    # Query to calculate average scores grouped by the date of last change
    scores = db.session.query(
        Ziele.letzte_aenderung.label('date'),
        func.avg(Ziele.bewertung).label('average_score')
    ).group_by(Ziele.letzte_aenderung).all()

    # Format the results to send as JSON
    score_data = [{"date": str(score.date), "average_score": score.average_score} for score in scores]
    return jsonify(score_data)

