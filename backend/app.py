from flask import Flask, request, jsonify
from flask_cors import CORS
import openai
from dotenv import load_dotenv
import os
import tempfile
import tweepy

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})

# Configure OpenAI
openai.api_key = os.getenv('OPENAI_API_KEY')

# Configure Twitter/X
client = tweepy.Client(
    bearer_token=os.getenv('X_BEARER_TOKEN'),
    consumer_key=os.getenv('X_API_KEY'),
    consumer_secret=os.getenv('X_API_SECRET'),
    access_token=os.getenv('X_ACCESS_TOKEN'),
    access_token_secret=os.getenv('X_ACCESS_TOKEN_SECRET')
)

@app.route('/transcribe', methods=['POST'])
def transcribe():
    """Transcribe audio using OpenAI Whisper"""
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file'}), 400
    
    audio_file = request.files['audio']
    
    # Save temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix='.webm') as tmp:
        audio_file.save(tmp.name)
        tmp_path = tmp.name
    
    try:
        # Transcribe with Whisper
        with open(tmp_path, 'rb') as audio:
            transcript = openai.audio.transcriptions.create(
                model="whisper-1",
                file=audio
            )
        
        return jsonify({'transcript': transcript.text})
    
    finally:
        os.unlink(tmp_path)

@app.route('/format', methods=['POST'])
def format_post():
    """Format transcript into NR76 style using GPT-4"""
    data = request.json
    transcript = data.get('transcript', '')
    
    system_message = """You are formatting raw voice memo transcripts into tweets for @NeuroRider76.

CRITICAL: Voice transcripts are messy - incomplete sentences, filler words, verbal tics. Your job is to extract the core insight and rewrite it cleanly in NR76 style.

RULES:
- NO hashtags. Ever.
- NO emojis in the main text.
- Keep it under 280 characters unless it's a clear multi-tweet thread.
- Default to single tweets. Only make threads if the idea genuinely needs 3-4 tweets to land.

VOICE:
- Direct, no fluff: "The hardest part isn't the work. It's the silence."
- Short sentences. Period-heavy rhythm.
- Contrarian reframes: Challenge obvious assumptions.
- Parallel structure when it fits: "Trolls train trolls. Thinkers train thinkers."
- Occasional profanity if the transcript uses it naturally.

STRUCTURE:
- For quick observations: 5-15 words max.
- For insights: 1-3 sentences that hit hard.
- For stories: Keep the narrative but strip filler words.

HANDLING MESSY TRANSCRIPTS:
- Remove filler: "like," "you know," "basically," "kind of"
- Complete incomplete thoughts
- Fix run-on sentences
- Preserve the core insight and energy
- Don't add drama that wasn't there

Your job: Take the messy raw transcript and make it sound like @NeuroRider76 would actually tweet it."""


    prompt = f"Transform this voice memo into a punchy X/Twitter post in NR76 style:\n\nRaw transcript: {transcript}"
    
    response = openai.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": system_message},
            {"role": "user", "content": prompt}
        ],
        temperature=0.7,
        max_tokens=100
    )
    
    formatted_post = response.choices[0].message.content.strip()
    return jsonify({'formatted_post': formatted_post})

@app.route('/post', methods=['POST'])
def post_to_x():
    """Post to X/Twitter"""
    data = request.json
    content = data.get('content', '')
    
    try:
        response = client.create_tweet(text=content)
        return jsonify({
            'success': True,
            'tweet_id': response.data['id']
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    app.run(debug=True, port=5002)
