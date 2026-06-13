from flask import Flask, render_template, jsonify, request
import json
import os

app = Flask(__name__)

DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')

def load_json(filename):
    with open(os.path.join(DATA_DIR, filename), 'r', encoding='utf-8') as f:
        return json.load(f)

@app.route('/')
def index():
    lessons = load_json('lessons.json')
    return render_template('index.html', categories=lessons['categories'])

@app.route('/category/<category_id>')
def category(category_id):
    lessons = load_json('lessons.json')
    if category_id not in lessons['categories']:
        return "カテゴリが見つかりません", 404
    cat_lessons = [l for l in lessons['lessons'] if l['category'] == category_id]
    return render_template('category.html',
                           category=lessons['categories'][category_id],
                           category_id=category_id,
                           lessons=cat_lessons)

@app.route('/lesson/<lesson_id>')
def lesson(lesson_id):
    lessons = load_json('lessons.json')
    lesson_data = next((l for l in lessons['lessons'] if l['id'] == lesson_id), None)
    if not lesson_data:
        return "レッスンが見つかりません", 404
    cat_lessons = [l for l in lessons['lessons'] if l['category'] == lesson_data['category']]
    idx = next((i for i, l in enumerate(cat_lessons) if l['id'] == lesson_id), 0)
    prev_lesson = cat_lessons[idx - 1] if idx > 0 else None
    next_lesson = cat_lessons[idx + 1] if idx < len(cat_lessons) - 1 else None
    return render_template('lesson.html',
                           lesson=lesson_data,
                           category=lessons['categories'][lesson_data['category']],
                           category_id=lesson_data['category'],
                           prev_lesson=prev_lesson,
                           next_lesson=next_lesson)

@app.route('/quiz')
def quiz():
    lessons = load_json('lessons.json')
    return render_template('quiz.html', categories=lessons['categories'])

@app.route('/api/quizzes')
def api_quizzes():
    quizzes = load_json('quizzes.json')
    category_id = request.args.get('category', 'all')
    if category_id != 'all':
        quizzes = [q for q in quizzes if q['category'] == category_id]
    return jsonify(quizzes)

@app.route('/danger-quiz')
def danger_quiz():
    return render_template('danger_quiz.html')

@app.route('/api/danger-quizzes')
def api_danger_quizzes():
    quizzes = load_json('danger_quizzes.json')
    return jsonify(quizzes)

@app.route('/code-breakdown')
def code_breakdown():
    breakdowns = load_json('code_breakdowns.json')
    return render_template('code_breakdown.html', breakdowns=breakdowns)

@app.route('/consultant-practice')
def consultant_practice():
    phrases = load_json('consultant_phrases.json')
    return render_template('consultant_practice.html', phrases=phrases)

@app.route('/api/lessons')
def api_lessons():
    lessons = load_json('lessons.json')
    return jsonify(lessons)

@app.route('/api/progress', methods=['GET'])
def get_progress():
    progress_file = os.path.join(DATA_DIR, 'progress.json')
    if os.path.exists(progress_file):
        with open(progress_file, 'r', encoding='utf-8') as f:
            return jsonify(json.load(f))
    return jsonify({})

@app.route('/api/progress', methods=['POST'])
def save_progress():
    data = request.get_json()
    progress_file = os.path.join(DATA_DIR, 'progress.json')
    with open(progress_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    app.run(debug=True, port=5002)
