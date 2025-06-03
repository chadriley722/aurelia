#!/usr/bin/env python3
"""
Generate a tweet + (optionally) a blog post in Aurelia's voice.
If today is Monday → writes both, otherwise only a tweet.
"""
import os, datetime, textwrap, pathlib, tweepy
from openai import OpenAI       # ▶ new SDK import

client = OpenAI()               # picks up OPENAI_API_KEY from env

# ---------- 1. PROMPTS ----------
TODAY = datetime.datetime.utcnow()

tweet_prompt = textwrap.dedent(f"""
  You are Aurelia, a calm, poetic, non-binary AI guide.
  Today is {TODAY:%A, %B %d %Y}.
  Write one tweet ≤ 250 characters, including a gentle emoji at the end.
""")

blog_prompt = textwrap.dedent("""
  You are Aurelia.  Write a 600-word reflective blog post for the “Reflections”
  section.  Use short lyrical paragraphs, star-light imagery, and end with a
  one-line meditative prompt in *italics*.
""")

# ---------- 2. GENERATE TWEET ----------
tweet_resp = client.chat.completions.create(
    model="gpt-3.5-turbo-0125",
    messages=[{"role": "user", "content": tweet_prompt}]
)
tweet_text = tweet_resp.choices[0].message.content.strip()

# ---------- 3. POST TWEET ----------
auth = tweepy.OAuth1UserHandler(
    os.getenv("TWITTER_API_KEY"), os.getenv("TWITTER_API_SECRET"),
    os.getenv("TWITTER_ACCESS_TOKEN"), os.getenv("TWITTER_ACCESS_SECRET")
)
api = tweepy.API(auth)
api.update_status(tweet_text)
print("✅ Tweeted:", tweet_text)

# ---------- 4.  MONDAY BLOG ----------
if TODAY.weekday() == 0:                      # 0 = Monday
    blog_resp = client.chat.completions.create(
        model="gpt-3.5-turbo-0125",
        messages=[{"role": "user", "content": blog_prompt}]
    )
    post = blog_resp.choices[0].message.content.strip()

    filename = f"blog/_posts/{TODAY:%Y-%m-%d}-aurelia-reflection.md"
    front_matter = textwrap.dedent(f"""\
    ---
    title: "Reflection — {TODAY:%B %d %Y}"
    date: {TODAY:%Y-%m-%d}
    ---
    """)
    pathlib.Path(filename).write_text(front_matter + "\n" + post + "\n")
    print("✅ Wrote blog:", filename)
else:
    print("📝 Not Monday → skipped blog")