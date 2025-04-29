BEGIN TRANSACTION;
INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Adventurousness', 'WHO_I_AM', 'You prefer outdoor activities.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Adventurousness' AND question_stem = 'You prefer outdoor activities.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Adventurousness' AND question_stem = 'You prefer outdoor activities.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Adventurousness', 'WHO_I_AM', 'How do you generally spend your weekend?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Adventurousness' AND question_stem = 'How do you generally spend your weekend?' LIMIT 1), 'Relaxing at home');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Adventurousness' AND question_stem = 'How do you generally spend your weekend?' LIMIT 1), 'Catching up on work or studying');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Adventurousness' AND question_stem = 'How do you generally spend your weekend?' LIMIT 1), 'Going out to bars');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Adventurousness' AND question_stem = 'How do you generally spend your weekend?' LIMIT 1), 'Galleries, museums, concerts');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Adventurousness' AND question_stem = 'How do you generally spend your weekend?' LIMIT 1), 'Other');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Travel compatibility', 'WHO_I_AM', 'Time for a vacation! What''s your plan?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Travel compatibility' AND question_stem = 'Time for a vacation! What''s your plan?' LIMIT 1), 'Relaxing on the beach');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Travel compatibility' AND question_stem = 'Time for a vacation! What''s your plan?' LIMIT 1), 'Exploring new cities');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Travel compatibility' AND question_stem = 'Time for a vacation! What''s your plan?' LIMIT 1), 'Festivals or concerts');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Travel compatibility' AND question_stem = 'Time for a vacation! What''s your plan?' LIMIT 1), 'Somewhere in nature');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Travel compatibility', 'WHO_I_AM', 'What''s your top priority when traveling?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Travel compatibility' AND question_stem = 'What''s your top priority when traveling?' LIMIT 1), 'The food scene');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Travel compatibility' AND question_stem = 'What''s your top priority when traveling?' LIMIT 1), 'Experiencing new cultures');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Travel compatibility' AND question_stem = 'What''s your top priority when traveling?' LIMIT 1), 'Exploring tourist attractions');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Travel compatibility' AND question_stem = 'What''s your top priority when traveling?' LIMIT 1), 'Relaxing');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Travel compatibility', 'WHO_I_AM', 'Travel is a big part of my life.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Travel compatibility' AND question_stem = 'Travel is a big part of my life.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Travel compatibility' AND question_stem = 'Travel is a big part of my life.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Alcohol consumption', 'WHO_I_WANT', 'I prefer someone who doesn''t drink alcohol.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Alcohol consumption' AND question_stem = 'I prefer someone who doesn''t drink alcohol.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Alcohol consumption' AND question_stem = 'I prefer someone who doesn''t drink alcohol.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Dining compatibility', 'WHO_I_AM', 'Date night! Which restaurant would be your first choice?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Dining compatibility' AND question_stem = 'Date night! Which restaurant would be your first choice?' LIMIT 1), 'Italian');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Dining compatibility' AND question_stem = 'Date night! Which restaurant would be your first choice?' LIMIT 1), 'Asian');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Dining compatibility' AND question_stem = 'Date night! Which restaurant would be your first choice?' LIMIT 1), 'American');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Dining compatibility' AND question_stem = 'Date night! Which restaurant would be your first choice?' LIMIT 1), 'Vegetarian');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Dining compatibility', 'WHO_I_AM', 'It''s a weeknight. How do you decide what''s for dinner?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Dining compatibility' AND question_stem = 'It''s a weeknight. How do you decide what''s for dinner?' LIMIT 1), 'Health first. Fuel the body right');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Dining compatibility' AND question_stem = 'It''s a weeknight. How do you decide what''s for dinner?' LIMIT 1), 'Cravings rule. If it''s tasty, I''m eating it');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Dining compatibility' AND question_stem = 'It''s a weeknight. How do you decide what''s for dinner?' LIMIT 1), 'Whatever I''ve meal planned');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Dining compatibility' AND question_stem = 'It''s a weeknight. How do you decide what''s for dinner?' LIMIT 1), 'New is ideal. I love trying new spots');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Food preference', 'WHO_I_AM', 'How often do you grab fast food?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Food preference' AND question_stem = 'How often do you grab fast food?' LIMIT 1), 'Never');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Food preference' AND question_stem = 'How often do you grab fast food?' LIMIT 1), 'Rarely');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Food preference' AND question_stem = 'How often do you grab fast food?' LIMIT 1), 'Sometimes');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Food preference' AND question_stem = 'How often do you grab fast food?' LIMIT 1), 'Regularly');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Food preference' AND question_stem = 'How often do you grab fast food?' LIMIT 1), 'Frequently');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Food preference', 'WHO_I_AM', 'How often do you order takeout or delivery each week?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Food preference' AND question_stem = 'How often do you order takeout or delivery each week?' LIMIT 1), 'Never');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Food preference' AND question_stem = 'How often do you order takeout or delivery each week?' LIMIT 1), 'Rarely');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Food preference' AND question_stem = 'How often do you order takeout or delivery each week?' LIMIT 1), 'Sometimes');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Food preference' AND question_stem = 'How often do you order takeout or delivery each week?' LIMIT 1), 'Regularly');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Food preference', 'WHO_I_AM', 'My grocery haul is mostly healthy foods.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Food preference' AND question_stem = 'My grocery haul is mostly healthy foods.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Food preference' AND question_stem = 'My grocery haul is mostly healthy foods.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Organization', 'WHO_I_AM', 'Your friends would call you a neat freak.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Organization' AND question_stem = 'Your friends would call you a neat freak.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Organization' AND question_stem = 'Your friends would call you a neat freak.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Financial tendencies', 'WHO_I_AM', 'I''d rather save money for the future than live in the moment.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Financial tendencies' AND question_stem = 'I''d rather save money for the future than live in the moment.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Financial tendencies' AND question_stem = 'I''d rather save money for the future than live in the moment.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Financial tendencies', 'WHO_I_AM', 'What''s your money management style?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Financial tendencies' AND question_stem = 'What''s your money management style?' LIMIT 1), 'I stick to a strict budget');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Financial tendencies' AND question_stem = 'What''s your money management style?' LIMIT 1), 'I budget, but I''m flexible with it');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Financial tendencies' AND question_stem = 'What''s your money management style?' LIMIT 1), 'I track my spending casually');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Financial tendencies' AND question_stem = 'What''s your money management style?' LIMIT 1), 'I''m more on the spontaneous side');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Financial tendencies' AND question_stem = 'What''s your money management style?' LIMIT 1), 'None of the above');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Active lifestyle compatibility', 'WHO_I_AM', 'What motivates you to exercise?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Active lifestyle compatibility' AND question_stem = 'What motivates you to exercise?' LIMIT 1), 'My competition');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Active lifestyle compatibility' AND question_stem = 'What motivates you to exercise?' LIMIT 1), 'My health goals');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Active lifestyle compatibility' AND question_stem = 'What motivates you to exercise?' LIMIT 1), 'The endorphin rush');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Active lifestyle compatibility' AND question_stem = 'What motivates you to exercise?' LIMIT 1), 'Not much, really');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Active lifestyle compatibility', 'WHO_I_AM', 'You''d love to work out with your partner.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Active lifestyle compatibility' AND question_stem = 'You''d love to work out with your partner.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Active lifestyle compatibility' AND question_stem = 'You''d love to work out with your partner.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Active lifestyle compatibility', 'WHO_I_AM', 'Staying fit is important to you. ');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Active lifestyle compatibility' AND question_stem = 'Staying fit is important to you. ' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Active lifestyle compatibility' AND question_stem = 'Staying fit is important to you. ' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Extroversion compatibility', 'WHO_I_AM', 'You''re definitely a "night out" kind of person.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Extroversion compatibility' AND question_stem = 'You''re definitely a "night out" kind of person.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Extroversion compatibility' AND question_stem = 'You''re definitely a "night out" kind of person.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Extroversion compatibility', 'WHO_I_AM', 'How do you feel about traveling as a group?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Extroversion compatibility' AND question_stem = 'How do you feel about traveling as a group?' LIMIT 1), 'Meh');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Extroversion compatibility' AND question_stem = 'How do you feel about traveling as a group?' LIMIT 1), 'Not really into it, but I can handle it');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Extroversion compatibility' AND question_stem = 'How do you feel about traveling as a group?' LIMIT 1), 'Open to it most of the time');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Extroversion compatibility' AND question_stem = 'How do you feel about traveling as a group?' LIMIT 1), 'Love it!');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Extroversion compatibility', 'WHO_I_AM', 'What kind of social activities do you tend to enjoy the most?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Extroversion compatibility' AND question_stem = 'What kind of social activities do you tend to enjoy the most?' LIMIT 1), 'Parties');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Extroversion compatibility' AND question_stem = 'What kind of social activities do you tend to enjoy the most?' LIMIT 1), 'Sports');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Extroversion compatibility' AND question_stem = 'What kind of social activities do you tend to enjoy the most?' LIMIT 1), 'Concerts');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Extroversion compatibility' AND question_stem = 'What kind of social activities do you tend to enjoy the most?' LIMIT 1), 'Chilling alone or with a close group');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Extroversion compatibility' AND question_stem = 'What kind of social activities do you tend to enjoy the most?' LIMIT 1), 'None of the above');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Daily routine compatibility', 'WHO_I_AM', 'You''re very much a night owl. ');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Daily routine compatibility' AND question_stem = 'You''re very much a night owl. ' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Daily routine compatibility' AND question_stem = 'You''re very much a night owl. ' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Daily routine compatibility', 'WHO_I_AM', 'You''re open to your partner having a different sleep schedule from yours. ');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Daily routine compatibility' AND question_stem = 'You''re open to your partner having a different sleep schedule from yours. ' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Daily routine compatibility' AND question_stem = 'You''re open to your partner having a different sleep schedule from yours. ' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Extroversion compatibility', 'WHO_I_AM', 'You feel energized after hanging out with a big group of friends. ');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Extroversion compatibility' AND question_stem = 'You feel energized after hanging out with a big group of friends. ' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Extroversion compatibility' AND question_stem = 'You feel energized after hanging out with a big group of friends. ' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Extroversion compatibility', 'WHO_I_AM', 'You need time alone at home on weekends.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Extroversion compatibility' AND question_stem = 'You need time alone at home on weekends.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Extroversion compatibility' AND question_stem = 'You need time alone at home on weekends.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Extroversion compatibility', 'WHO_I_AM', 'Do you prefer to spend your free time alone or with others?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Extroversion compatibility' AND question_stem = 'Do you prefer to spend your free time alone or with others?' LIMIT 1), 'With others');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Extroversion compatibility' AND question_stem = 'Do you prefer to spend your free time alone or with others?' LIMIT 1), 'Alone');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Extroversion compatibility' AND question_stem = 'Do you prefer to spend your free time alone or with others?' LIMIT 1), 'It depends!');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Extroversion compatibility' AND question_stem = 'Do you prefer to spend your free time alone or with others?' LIMIT 1), 'Prefer not to say');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Directness', 'WHO_I_AM', 'You don''t mind if you and your partner have different opinions. ');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Directness' AND question_stem = 'You don''t mind if you and your partner have different opinions. ' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Directness' AND question_stem = 'You don''t mind if you and your partner have different opinions. ' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Career priorities', 'WHO_I_AM', 'For you, work is all about building an empire. ');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Career priorities' AND question_stem = 'For you, work is all about building an empire. ' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Career priorities' AND question_stem = 'For you, work is all about building an empire. ' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Ambition', 'WHO_I_WANT', 'I want to meet someone who is highly ambitious.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Ambition' AND question_stem = 'I want to meet someone who is highly ambitious.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Ambition' AND question_stem = 'I want to meet someone who is highly ambitious.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Political alignment', 'WHO_I_AM', 'You''re very interested in politics. ');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Political alignment' AND question_stem = 'You''re very interested in politics. ' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Political alignment' AND question_stem = 'You''re very interested in politics. ' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Political alignment', 'WHO_I_AM', 'Sharing political views matters to me in a relationship.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Political alignment' AND question_stem = 'Sharing political views matters to me in a relationship.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Political alignment' AND question_stem = 'Sharing political views matters to me in a relationship.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Family values', 'WHO_I_AM', 'Following your family traditions is important to you.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Family values' AND question_stem = 'Following your family traditions is important to you.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Family values' AND question_stem = 'Following your family traditions is important to you.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Family values', 'WHO_I_AM', 'You enjoy gatherings with close family.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Family values' AND question_stem = 'You enjoy gatherings with close family.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Family values' AND question_stem = 'You enjoy gatherings with close family.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Family values', 'WHO_I_AM', 'How often do you speak with your family?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Family values' AND question_stem = 'How often do you speak with your family?' LIMIT 1), 'I talk or text with them every day');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Family values' AND question_stem = 'How often do you speak with your family?' LIMIT 1), 'I stay in touch a few times a week');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Family values' AND question_stem = 'How often do you speak with your family?' LIMIT 1), 'I check in occasionally');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Family values' AND question_stem = 'How often do you speak with your family?' LIMIT 1), 'I’m more independent, we don''t talk much');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Family values' AND question_stem = 'How often do you speak with your family?' LIMIT 1), 'Prefer not to say');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Career priorities', 'WHO_I_AM', 'You''d take a job with a lot of travel required.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Career priorities' AND question_stem = 'You''d take a job with a lot of travel required.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Career priorities' AND question_stem = 'You''d take a job with a lot of travel required.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Career priorities', 'WHO_I_AM', 'Climbing the career ladder is important to you.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Career priorities' AND question_stem = 'Climbing the career ladder is important to you.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Career priorities' AND question_stem = 'Climbing the career ladder is important to you.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Food preference', 'WHO_I_AM', 'Rise and shine! What''s for breakfast? Choose all that apply.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Food preference' AND question_stem = 'Rise and shine! What''s for breakfast? Choose all that apply.' LIMIT 1), 'BaconAndEggs');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Food preference' AND question_stem = 'Rise and shine! What''s for breakfast? Choose all that apply.' LIMIT 1), 'Banana');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Food preference' AND question_stem = 'Rise and shine! What''s for breakfast? Choose all that apply.' LIMIT 1), 'Bread');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Food preference' AND question_stem = 'Rise and shine! What''s for breakfast? Choose all that apply.' LIMIT 1), 'Cereal');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Food preference' AND question_stem = 'Rise and shine! What''s for breakfast? Choose all that apply.' LIMIT 1), 'Chocolate');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Food preference' AND question_stem = 'Rise and shine! What''s for breakfast? Choose all that apply.' LIMIT 1), 'Crepe');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Food preference' AND question_stem = 'Rise and shine! What''s for breakfast? Choose all that apply.' LIMIT 1), 'Croissant');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Food preference' AND question_stem = 'Rise and shine! What''s for breakfast? Choose all that apply.' LIMIT 1), 'DimSum');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Food preference' AND question_stem = 'Rise and shine! What''s for breakfast? Choose all that apply.' LIMIT 1), 'Donut');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Food preference' AND question_stem = 'Rise and shine! What''s for breakfast? Choose all that apply.' LIMIT 1), 'Muffin');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Food preference' AND question_stem = 'Rise and shine! What''s for breakfast? Choose all that apply.' LIMIT 1), 'Noodle');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Food preference' AND question_stem = 'Rise and shine! What''s for breakfast? Choose all that apply.' LIMIT 1), 'PanCake');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Food preference' AND question_stem = 'Rise and shine! What''s for breakfast? Choose all that apply.' LIMIT 1), 'Sandwich');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Food preference' AND question_stem = 'Rise and shine! What''s for breakfast? Choose all that apply.' LIMIT 1), 'Waffle');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Food preference' AND question_stem = 'Rise and shine! What''s for breakfast? Choose all that apply.' LIMIT 1), 'Yogurt');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Food preference' AND question_stem = 'Rise and shine! What''s for breakfast? Choose all that apply.' LIMIT 1), 'None of the above');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Career priorities', 'WHO_I_AM', 'You work to live, not live to work. ');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Career priorities' AND question_stem = 'You work to live, not live to work. ' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Career priorities' AND question_stem = 'You work to live, not live to work. ' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Creative date preferences', 'WHO_I_AM', 'You work on creative projects for fun. ');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Creative date preferences' AND question_stem = 'You work on creative projects for fun. ' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Creative date preferences' AND question_stem = 'You work on creative projects for fun. ' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Artistry', 'WHO_I_WANT', 'Handmade gifts are more meaningful to you.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Artistry' AND question_stem = 'Handmade gifts are more meaningful to you.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Artistry' AND question_stem = 'Handmade gifts are more meaningful to you.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Career priorities', 'WHO_I_AM', 'You''d move across the country for the right job.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Career priorities' AND question_stem = 'You''d move across the country for the right job.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Career priorities' AND question_stem = 'You''d move across the country for the right job.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Career priorities', 'WHO_I_WANT', 'Does your partner’s work-life balance matter to you?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Career priorities' AND question_stem = 'Does your partner’s work-life balance matter to you?' LIMIT 1), 'I’d prefer they have a life outside of work');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Career priorities' AND question_stem = 'Does your partner’s work-life balance matter to you?' LIMIT 1), 'I’d respect if they put their work first');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Career priorities' AND question_stem = 'Does your partner’s work-life balance matter to you?' LIMIT 1), 'Doesn''t matter to me');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Career priorities' AND question_stem = 'Does your partner’s work-life balance matter to you?' LIMIT 1), 'Prefer not to say');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Career priorities', 'WHO_I_AM', 'Your friends call you a workaholic.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Career priorities' AND question_stem = 'Your friends call you a workaholic.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Career priorities' AND question_stem = 'Your friends call you a workaholic.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Career priorities', 'WHO_I_AM', 'Do you work while on vacation?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Career priorities' AND question_stem = 'Do you work while on vacation?' LIMIT 1), 'Never');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Career priorities' AND question_stem = 'Do you work while on vacation?' LIMIT 1), 'Only for emergencies');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Career priorities' AND question_stem = 'Do you work while on vacation?' LIMIT 1), 'Yes, even though I shouldn’t');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Career priorities' AND question_stem = 'Do you work while on vacation?' LIMIT 1), 'Yes, it''s mandatory');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Organization', 'WHO_I_AM', 'Who cleans your home?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Organization' AND question_stem = 'Who cleans your home?' LIMIT 1), 'I do, by myself');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Organization' AND question_stem = 'Who cleans your home?' LIMIT 1), 'I share duties with roommates');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Organization' AND question_stem = 'Who cleans your home?' LIMIT 1), 'I pay a house cleaner');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Organization' AND question_stem = 'Who cleans your home?' LIMIT 1), 'Clean?');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Artistry', 'WHO_I_WANT', 'Which would you find attractive in a partner?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Artistry' AND question_stem = 'Which would you find attractive in a partner?' LIMIT 1), 'Loves to dance');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Artistry' AND question_stem = 'Which would you find attractive in a partner?' LIMIT 1), 'Loves to sing');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Artistry' AND question_stem = 'Which would you find attractive in a partner?' LIMIT 1), 'Loves photography');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Artistry' AND question_stem = 'Which would you find attractive in a partner?' LIMIT 1), 'Loves to write');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Dining compatibility', 'WHO_I_AM', 'Do you like spicy food?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Dining compatibility' AND question_stem = 'Do you like spicy food?' LIMIT 1), 'Yep. Hotter the better!');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Dining compatibility' AND question_stem = 'Do you like spicy food?' LIMIT 1), 'Mild, please!');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Dining compatibility' AND question_stem = 'Do you like spicy food?' LIMIT 1), 'It depends');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Cooking', 'WHO_I_WANT', 'Do you want a partner you can cook with?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Cooking' AND question_stem = 'Do you want a partner you can cook with?' LIMIT 1), 'Yes, I love cooking together');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Cooking' AND question_stem = 'Do you want a partner you can cook with?' LIMIT 1), 'No, get out of my kitchen!');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Cooking' AND question_stem = 'Do you want a partner you can cook with?' LIMIT 1), 'We try it');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Money talks', 'WHO_I_AM', 'Who do you prefer to manage your household finances?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Money talks' AND question_stem = 'Who do you prefer to manage your household finances?' LIMIT 1), 'Me');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Money talks' AND question_stem = 'Who do you prefer to manage your household finances?' LIMIT 1), 'My partner');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Money talks' AND question_stem = 'Who do you prefer to manage your household finances?' LIMIT 1), 'We''d share the responsibility');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Money talks' AND question_stem = 'Who do you prefer to manage your household finances?' LIMIT 1), 'I''d keep our finances separate');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Gaming compatibility', 'WHO_I_AM', 'You consider yourself a gamer. ');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Gaming compatibility' AND question_stem = 'You consider yourself a gamer. ' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Gaming compatibility' AND question_stem = 'You consider yourself a gamer. ' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Conflict resolution', 'WHO_I_AM', 'You forgive and forget.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Conflict resolution' AND question_stem = 'You forgive and forget.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Conflict resolution' AND question_stem = 'You forgive and forget.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Gaming compatibility', 'WHO_I_AM', 'You enjoy watching others play video games. ');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Gaming compatibility' AND question_stem = 'You enjoy watching others play video games. ' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Gaming compatibility' AND question_stem = 'You enjoy watching others play video games. ' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Gaming compatibility', 'WHO_I_AM', 'How often do you play video games?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Gaming compatibility' AND question_stem = 'How often do you play video games?' LIMIT 1), 'Frequently');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Gaming compatibility' AND question_stem = 'How often do you play video games?' LIMIT 1), 'Never');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Gaming compatibility' AND question_stem = 'How often do you play video games?' LIMIT 1), 'Sometimes');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Gaming compatibility' AND question_stem = 'How often do you play video games?' LIMIT 1), 'Regularly');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Gaming compatibility', 'WHO_I_WANT', 'Do you want a partner who plays video games?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Gaming compatibility' AND question_stem = 'Do you want a partner who plays video games?' LIMIT 1), 'Makes no difference to me');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Gaming compatibility' AND question_stem = 'Do you want a partner who plays video games?' LIMIT 1), 'I''d love if they did');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Gaming compatibility' AND question_stem = 'Do you want a partner who plays video games?' LIMIT 1), 'I''d prefer they don''t');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Gaming compatibility' AND question_stem = 'Do you want a partner who plays video games?' LIMIT 1), 'Other');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Gaming compatibility', 'WHO_I_AM', 'What kinds of games are you into? Choose all that apply.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Gaming compatibility' AND question_stem = 'What kinds of games are you into? Choose all that apply.' LIMIT 1), 'Video games');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Gaming compatibility' AND question_stem = 'What kinds of games are you into? Choose all that apply.' LIMIT 1), 'Turn-based strategy or MMORPGs');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Gaming compatibility' AND question_stem = 'What kinds of games are you into? Choose all that apply.' LIMIT 1), 'Board, card, or tabletop games');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Gaming compatibility' AND question_stem = 'What kinds of games are you into? Choose all that apply.' LIMIT 1), 'I don''t like games');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Gaming compatibility' AND question_stem = 'What kinds of games are you into? Choose all that apply.' LIMIT 1), 'Puzzle or casual games');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Fitness/Sports', 'WHO_I_AM', 'What outdoor sports do you enjoy? Choose all that apply.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Fitness/Sports' AND question_stem = 'What outdoor sports do you enjoy? Choose all that apply.' LIMIT 1), 'Kayak');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Fitness/Sports' AND question_stem = 'What outdoor sports do you enjoy? Choose all that apply.' LIMIT 1), 'Archery');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Fitness/Sports' AND question_stem = 'What outdoor sports do you enjoy? Choose all that apply.' LIMIT 1), 'MountainBike');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Fitness/Sports' AND question_stem = 'What outdoor sports do you enjoy? Choose all that apply.' LIMIT 1), 'RiverRaft');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Fitness/Sports' AND question_stem = 'What outdoor sports do you enjoy? Choose all that apply.' LIMIT 1), 'Ski');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Fitness/Sports' AND question_stem = 'What outdoor sports do you enjoy? Choose all that apply.' LIMIT 1), 'Snowboard');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Fitness/Sports' AND question_stem = 'What outdoor sports do you enjoy? Choose all that apply.' LIMIT 1), 'Hockey');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Fitness/Sports' AND question_stem = 'What outdoor sports do you enjoy? Choose all that apply.' LIMIT 1), 'FigureSkate');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Fitness/Sports' AND question_stem = 'What outdoor sports do you enjoy? Choose all that apply.' LIMIT 1), 'ATV');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Fitness/Sports' AND question_stem = 'What outdoor sports do you enjoy? Choose all that apply.' LIMIT 1), 'Fishing');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Fitness/Sports' AND question_stem = 'What outdoor sports do you enjoy? Choose all that apply.' LIMIT 1), 'Golf');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Fitness/Sports' AND question_stem = 'What outdoor sports do you enjoy? Choose all that apply.' LIMIT 1), 'Tennis');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Fitness/Sports' AND question_stem = 'What outdoor sports do you enjoy? Choose all that apply.' LIMIT 1), 'Croquet');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Fitness/Sports' AND question_stem = 'What outdoor sports do you enjoy? Choose all that apply.' LIMIT 1), 'Frisbee');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Fitness/Sports' AND question_stem = 'What outdoor sports do you enjoy? Choose all that apply.' LIMIT 1), 'Cornhole');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Fitness/Sports' AND question_stem = 'What outdoor sports do you enjoy? Choose all that apply.' LIMIT 1), 'Soccer');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Travel compatibility', 'WHO_I_AM', 'You have a passport and you''re ready to use it. ');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Travel compatibility' AND question_stem = 'You have a passport and you''re ready to use it. ' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Travel compatibility' AND question_stem = 'You have a passport and you''re ready to use it. ' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Work vibes', 'WHO_I_AM', 'You regularly travel for work.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Work vibes' AND question_stem = 'You regularly travel for work.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Work vibes' AND question_stem = 'You regularly travel for work.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Work vibes', 'WHO_I_WANT', 'You prefer dating someone who doesn''t travel a lot for work.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Work vibes' AND question_stem = 'You prefer dating someone who doesn''t travel a lot for work.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Work vibes' AND question_stem = 'You prefer dating someone who doesn''t travel a lot for work.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Travel compatibility', 'WHO_I_WANT', 'You would be okay with dating someone who has a fear of flying.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Travel compatibility' AND question_stem = 'You would be okay with dating someone who has a fear of flying.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Travel compatibility' AND question_stem = 'You would be okay with dating someone who has a fear of flying.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Travel compatibility', 'WHO_I_AM', 'Do you usually stay in a hotel or hostel?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Travel compatibility' AND question_stem = 'Do you usually stay in a hotel or hostel?' LIMIT 1), 'Hotel');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Travel compatibility' AND question_stem = 'Do you usually stay in a hotel or hostel?' LIMIT 1), 'Hostel');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Travel compatibility', 'WHO_I_AM', 'You would love to live on a boat.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Travel compatibility' AND question_stem = 'You would love to live on a boat.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Travel compatibility' AND question_stem = 'You would love to live on a boat.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Favorite Movie', 'WHO_I_AM', 'What types of movies do you like? Choose all that apply.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Favorite Movie' AND question_stem = 'What types of movies do you like? Choose all that apply.' LIMIT 1), 'Comedy');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Favorite Movie' AND question_stem = 'What types of movies do you like? Choose all that apply.' LIMIT 1), 'Sci-fi adventure');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Favorite Movie' AND question_stem = 'What types of movies do you like? Choose all that apply.' LIMIT 1), 'Historical drama');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Favorite Movie' AND question_stem = 'What types of movies do you like? Choose all that apply.' LIMIT 1), 'Horror or thriller');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Favorite Movie' AND question_stem = 'What types of movies do you like? Choose all that apply.' LIMIT 1), 'Animated');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Travel compatibility', 'WHO_I_AM', 'What vacation sounds more your speed?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Travel compatibility' AND question_stem = 'What vacation sounds more your speed?' LIMIT 1), 'Summit a mountain');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Travel compatibility' AND question_stem = 'What vacation sounds more your speed?' LIMIT 1), 'Visiting the tourist spots');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Travel compatibility' AND question_stem = 'What vacation sounds more your speed?' LIMIT 1), 'Spa treatments at a resort');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Travel compatibility' AND question_stem = 'What vacation sounds more your speed?' LIMIT 1), 'Read a book on the beach');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Travel compatibility' AND question_stem = 'What vacation sounds more your speed?' LIMIT 1), 'Other');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Travel compatibility', 'WHO_I_AM', 'When you travel, do you plan an itinerary?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Travel compatibility' AND question_stem = 'When you travel, do you plan an itinerary?' LIMIT 1), 'Yes, I love a solid plan');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Travel compatibility' AND question_stem = 'When you travel, do you plan an itinerary?' LIMIT 1), 'No, I prefer to let it unfold');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Travel compatibility' AND question_stem = 'When you travel, do you plan an itinerary?' LIMIT 1), 'I don''t travel that much');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Music', 'WHO_I_AM', 'When my favorite song comes on, I immediately sing along.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Music' AND question_stem = 'When my favorite song comes on, I immediately sing along.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Music' AND question_stem = 'When my favorite song comes on, I immediately sing along.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Personality', 'WHO_I_AM', 'Are you the "planner" in your family or friend group?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Personality' AND question_stem = 'Are you the "planner" in your family or friend group?' LIMIT 1), 'No, and I love it');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Personality' AND question_stem = 'Are you the "planner" in your family or friend group?' LIMIT 1), 'Yes, but it stresses me out');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Personality' AND question_stem = 'Are you the "planner" in your family or friend group?' LIMIT 1), 'No, I tend to go with the flow');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Personality' AND question_stem = 'Are you the "planner" in your family or friend group?' LIMIT 1), 'I prefer to do things alone');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Ambition', 'WHO_I_AM', 'Do you strive for promotions at work?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Ambition' AND question_stem = 'Do you strive for promotions at work?' LIMIT 1), 'Of course, it''s all about the climb');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Ambition' AND question_stem = 'Do you strive for promotions at work?' LIMIT 1), 'Not really, I''m happy where I am');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Ambition' AND question_stem = 'Do you strive for promotions at work?' LIMIT 1), 'If it''s meant to be, it will be');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Ambition', 'WHO_I_AM', 'Thoughts on retiring early?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Ambition' AND question_stem = 'Thoughts on retiring early?' LIMIT 1), 'A goal I’m working toward');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Ambition' AND question_stem = 'Thoughts on retiring early?' LIMIT 1), 'Nice if it happens');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Ambition' AND question_stem = 'Thoughts on retiring early?' LIMIT 1), 'Fast way to die of boredom');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Ambition' AND question_stem = 'Thoughts on retiring early?' LIMIT 1), 'Retire? In this economy?');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Pet compatibility', 'WHO_I_AM', 'Are you allergic to cats or dogs?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Pet compatibility' AND question_stem = 'Are you allergic to cats or dogs?' LIMIT 1), 'Yes, cats');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Pet compatibility' AND question_stem = 'Are you allergic to cats or dogs?' LIMIT 1), 'Yes, dogs');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Pet compatibility' AND question_stem = 'Are you allergic to cats or dogs?' LIMIT 1), 'Yes, both cats and dogs');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Pet compatibility' AND question_stem = 'Are you allergic to cats or dogs?' LIMIT 1), 'Not allergic');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Pet compatibility', 'WHO_I_AM', 'Would you adopt a pet with a partner?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Pet compatibility' AND question_stem = 'Would you adopt a pet with a partner?' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Pet compatibility' AND question_stem = 'Would you adopt a pet with a partner?' LIMIT 1), 'Yes');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Pet compatibility' AND question_stem = 'Would you adopt a pet with a partner?' LIMIT 1), 'Maybe');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Pet friendliness', 'WHO_I_AM', 'It''s fine to bring a dog on a date. Better, even!');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Pet friendliness' AND question_stem = 'It''s fine to bring a dog on a date. Better, even!' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Pet friendliness' AND question_stem = 'It''s fine to bring a dog on a date. Better, even!' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Sex adventurousness', 'WHO_I_WANT', 'In the intimacy department, I''d rather keep it more vanilla.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Sex adventurousness' AND question_stem = 'In the intimacy department, I''d rather keep it more vanilla.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Sex adventurousness' AND question_stem = 'In the intimacy department, I''d rather keep it more vanilla.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Political alignment', 'WHO_I_AM', 'Should abortion be legal?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Political alignment' AND question_stem = 'Should abortion be legal?' LIMIT 1), 'Yes, always');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Political alignment' AND question_stem = 'Should abortion be legal?' LIMIT 1), 'With some restrictions');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Political alignment' AND question_stem = 'Should abortion be legal?' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Political alignment' AND question_stem = 'Should abortion be legal?' LIMIT 1), 'Prefer not to say');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Creative date preferences', 'WHO_I_AM', 'What would you enjoy the most?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Creative date preferences' AND question_stem = 'What would you enjoy the most?' LIMIT 1), 'Safari zone at a zoo');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Creative date preferences' AND question_stem = 'What would you enjoy the most?' LIMIT 1), 'Penguin shows at an aquarium');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Creative date preferences' AND question_stem = 'What would you enjoy the most?' LIMIT 1), 'Peaceful botanical garden');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Creative date preferences' AND question_stem = 'What would you enjoy the most?' LIMIT 1), 'Just a regular day at a cafe');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Independence', 'WHO_I_AM', 'Would you let your partner go through your phone?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Independence' AND question_stem = 'Would you let your partner go through your phone?' LIMIT 1), 'No way');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Independence' AND question_stem = 'Would you let your partner go through your phone?' LIMIT 1), 'Yes, of course');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Independence' AND question_stem = 'Would you let your partner go through your phone?' LIMIT 1), 'Only if they let me go through theirs');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Independence' AND question_stem = 'Would you let your partner go through your phone?' LIMIT 1), 'Prefer not to say');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Religion', 'WHO_I_AM', 'You''re a spiritual person.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Religion' AND question_stem = 'You''re a spiritual person.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Religion' AND question_stem = 'You''re a spiritual person.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Religion', 'WHO_I_AM', 'Do you observe religious holidays?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Religion' AND question_stem = 'Do you observe religious holidays?' LIMIT 1), 'No, I don''t observe any');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Religion' AND question_stem = 'Do you observe religious holidays?' LIMIT 1), 'Yes, but more for tradition');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Religion' AND question_stem = 'Do you observe religious holidays?' LIMIT 1), 'Some, but not all');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Religion' AND question_stem = 'Do you observe religious holidays?' LIMIT 1), 'I actively observe most or all');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Religion' AND question_stem = 'Do you observe religious holidays?' LIMIT 1), 'Prefer not to say');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Religion', 'WHO_I_WANT', 'Do you want a partner who shares your religion?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Religion' AND question_stem = 'Do you want a partner who shares your religion?' LIMIT 1), 'Very much so');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Religion' AND question_stem = 'Do you want a partner who shares your religion?' LIMIT 1), 'Doesn''t matter to me');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Religion' AND question_stem = 'Do you want a partner who shares your religion?' LIMIT 1), 'I’m not religious, but I don’t mind if they are');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Religion' AND question_stem = 'Do you want a partner who shares your religion?' LIMIT 1), 'I prefer they aren’t religious');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Religion' AND question_stem = 'Do you want a partner who shares your religion?' LIMIT 1), 'Not sure');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Expectations around sex', 'WHO_I_WANT', 'How do you feel about having friends with benefits?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Expectations around sex' AND question_stem = 'How do you feel about having friends with benefits?' LIMIT 1), 'Not for me');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Expectations around sex' AND question_stem = 'How do you feel about having friends with benefits?' LIMIT 1), 'Yes please');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Expectations around sex' AND question_stem = 'How do you feel about having friends with benefits?' LIMIT 1), 'Not sure, but I''m open to it');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Expectations around sex' AND question_stem = 'How do you feel about having friends with benefits?' LIMIT 1), 'Prefer not to say');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Expectations around sex', 'WHO_I_AM', 'Is a partner’s sexual history important to you?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Expectations around sex' AND question_stem = 'Is a partner’s sexual history important to you?' LIMIT 1), 'Not at all');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Expectations around sex' AND question_stem = 'Is a partner’s sexual history important to you?' LIMIT 1), 'Maybe a little');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Expectations around sex' AND question_stem = 'Is a partner’s sexual history important to you?' LIMIT 1), 'Yes');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Expectations around sex' AND question_stem = 'Is a partner’s sexual history important to you?' LIMIT 1), 'Prefer not to say');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Sex adventurousness', 'WHO_I_AM', 'Is emotional connection important during sex?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Sex adventurousness' AND question_stem = 'Is emotional connection important during sex?' LIMIT 1), 'It''s a plus, but not necessary');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Sex adventurousness' AND question_stem = 'Is emotional connection important during sex?' LIMIT 1), 'Absolutely');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Sex adventurousness' AND question_stem = 'Is emotional connection important during sex?' LIMIT 1), 'Nope');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Sex adventurousness' AND question_stem = 'Is emotional connection important during sex?' LIMIT 1), 'Prefer not to say');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Expectations around sex', 'WHO_I_AM', 'How often would you prefer to have sex?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Expectations around sex' AND question_stem = 'How often would you prefer to have sex?' LIMIT 1), 'Every day');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Expectations around sex' AND question_stem = 'How often would you prefer to have sex?' LIMIT 1), 'A few times a week');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Expectations around sex' AND question_stem = 'How often would you prefer to have sex?' LIMIT 1), 'Once or twice a month');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Expectations around sex' AND question_stem = 'How often would you prefer to have sex?' LIMIT 1), 'Doesn''t matter. Quality over quantity!');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Expectations around sex' AND question_stem = 'How often would you prefer to have sex?' LIMIT 1), 'Prefer not to say');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Sex adventurousness', 'WHO_I_AM', 'I''m definitely on the kinky side.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Sex adventurousness' AND question_stem = 'I''m definitely on the kinky side.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Sex adventurousness' AND question_stem = 'I''m definitely on the kinky side.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Sex adventurousness', 'WHO_I_WANT', 'What kind of energy do you prefer from a partner during sex?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Sex adventurousness' AND question_stem = 'What kind of energy do you prefer from a partner during sex?' LIMIT 1), 'They take charge');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Sex adventurousness' AND question_stem = 'What kind of energy do you prefer from a partner during sex?' LIMIT 1), 'They follow my lead');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Sex adventurousness' AND question_stem = 'What kind of energy do you prefer from a partner during sex?' LIMIT 1), 'We''re equal partners');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Sex adventurousness' AND question_stem = 'What kind of energy do you prefer from a partner during sex?' LIMIT 1), 'Prefer not to say');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Smoking', 'WHO_I_AM', 'Do you like smoking hookah?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Smoking' AND question_stem = 'Do you like smoking hookah?' LIMIT 1), 'I''d try it');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Smoking' AND question_stem = 'Do you like smoking hookah?' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Smoking' AND question_stem = 'Do you like smoking hookah?' LIMIT 1), 'Yes');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Smoking' AND question_stem = 'Do you like smoking hookah?' LIMIT 1), 'Prefer not to say');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Dating intention', 'WHO_I_AM', '5 dates this week sounds great!');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Dating intention' AND question_stem = '5 dates this week sounds great!' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Dating intention' AND question_stem = '5 dates this week sounds great!' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Artistry', 'WHO_I_WANT', 'Do you want to date someone artistic?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Artistry' AND question_stem = 'Do you want to date someone artistic?' LIMIT 1), 'I''d consider it');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Artistry' AND question_stem = 'Do you want to date someone artistic?' LIMIT 1), 'Yes. Artistic passion is attractive!');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Artistry' AND question_stem = 'Do you want to date someone artistic?' LIMIT 1), 'Not really not my type');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Artistry' AND question_stem = 'Do you want to date someone artistic?' LIMIT 1), 'Not sure');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Music', 'WHO_I_WANT', 'Musical talent is a turn on.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Music' AND question_stem = 'Musical talent is a turn on.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Music' AND question_stem = 'Musical talent is a turn on.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Dining compatibility', 'WHO_I_AM', 'I love hanging out at cafes ');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Dining compatibility' AND question_stem = 'I love hanging out at cafes ' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Dining compatibility' AND question_stem = 'I love hanging out at cafes ' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Relationship Values', 'WHO_I_WANT', 'It''s really important for you that your partner…');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Relationship Values' AND question_stem = 'It''s really important for you that your partner…' LIMIT 1), 'Can pick up on subtle signals');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Relationship Values' AND question_stem = 'It''s really important for you that your partner…' LIMIT 1), 'Respects different point of view');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Relationship Values' AND question_stem = 'It''s really important for you that your partner…' LIMIT 1), 'Is a good communicator');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Relationship Values' AND question_stem = 'It''s really important for you that your partner…' LIMIT 1), 'Appreciates my sense of humor');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Open-mindedness', 'WHO_I_AM', 'You hesitate when trying new activities.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Open-mindedness' AND question_stem = 'You hesitate when trying new activities.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Open-mindedness' AND question_stem = 'You hesitate when trying new activities.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Career priorities', 'WHO_I_WANT', 'Workaholics bother me.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Career priorities' AND question_stem = 'Workaholics bother me.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Career priorities' AND question_stem = 'Workaholics bother me.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Career priorities', 'WHO_I_WANT', 'I''d want my partner to stop working when we start a family.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Career priorities' AND question_stem = 'I''d want my partner to stop working when we start a family.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Career priorities' AND question_stem = 'I''d want my partner to stop working when we start a family.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Money talks', 'WHO_I_AM', 'Who would you prefer to be the stay-at-home parent?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Money talks' AND question_stem = 'Who would you prefer to be the stay-at-home parent?' LIMIT 1), 'Me');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Money talks' AND question_stem = 'Who would you prefer to be the stay-at-home parent?' LIMIT 1), 'My partner');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Organization', 'WHO_I_WANT', 'Being messy is a dealbreaker.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Organization' AND question_stem = 'Being messy is a dealbreaker.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Organization' AND question_stem = 'Being messy is a dealbreaker.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Conflict resolution', 'WHO_I_WANT', 'After an argument is over, how should your partner act?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Conflict resolution' AND question_stem = 'After an argument is over, how should your partner act?' LIMIT 1), 'Help me laugh it off');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Conflict resolution' AND question_stem = 'After an argument is over, how should your partner act?' LIMIT 1), 'Get me a gift or kind gesture');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Conflict resolution' AND question_stem = 'After an argument is over, how should your partner act?' LIMIT 1), 'Cuddle or get intimate');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Conflict resolution' AND question_stem = 'After an argument is over, how should your partner act?' LIMIT 1), 'Give me space for a while');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Conflict resolution' AND question_stem = 'After an argument is over, how should your partner act?' LIMIT 1), 'None of the above');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Conversation medium', 'WHO_I_WANT', 'Do you think people should use full sentences over text?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Conversation medium' AND question_stem = 'Do you think people should use full sentences over text?' LIMIT 1), 'Yes. Good grammar is important');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Conversation medium' AND question_stem = 'Do you think people should use full sentences over text?' LIMIT 1), 'In some situations, but not always');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Conversation medium' AND question_stem = 'Do you think people should use full sentences over text?' LIMIT 1), 'No lol');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Conversation medium', 'WHO_I_WANT', 'Do you prefer phone calls, video calls, or text messages?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Conversation medium' AND question_stem = 'Do you prefer phone calls, video calls, or text messages?' LIMIT 1), 'Phone calls');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Conversation medium' AND question_stem = 'Do you prefer phone calls, video calls, or text messages?' LIMIT 1), 'Video calls');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Conversation medium' AND question_stem = 'Do you prefer phone calls, video calls, or text messages?' LIMIT 1), 'Text messages');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Dating intention', 'WHO_I_WANT', 'I''d be fine dating someone who doesn''t want to marry.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Dating intention' AND question_stem = 'I''d be fine dating someone who doesn''t want to marry.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Dating intention' AND question_stem = 'I''d be fine dating someone who doesn''t want to marry.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Favorite Movie', 'WHO_I_WANT', 'Does it annoy you when other people talk during movies?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Favorite Movie' AND question_stem = 'Does it annoy you when other people talk during movies?' LIMIT 1), 'Yes, I need silence');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Favorite Movie' AND question_stem = 'Does it annoy you when other people talk during movies?' LIMIT 1), 'No, I don’t mind');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Favorite Movie' AND question_stem = 'Does it annoy you when other people talk during movies?' LIMIT 1), 'It’s fine, I talk too!');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Artistry', 'WHO_I_AM', 'I would date someone who isn''t artistic.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Artistry' AND question_stem = 'I would date someone who isn''t artistic.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Artistry' AND question_stem = 'I would date someone who isn''t artistic.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Active lifestyle compatibility', 'WHO_I_WANT', 'I love having a partner who motivates me to work out.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Active lifestyle compatibility' AND question_stem = 'I love having a partner who motivates me to work out.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Active lifestyle compatibility' AND question_stem = 'I love having a partner who motivates me to work out.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Fitness/Sports', 'WHO_I_WANT', 'I''d love to have a partner who plays sports with me.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Fitness/Sports' AND question_stem = 'I''d love to have a partner who plays sports with me.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Fitness/Sports' AND question_stem = 'I''d love to have a partner who plays sports with me.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Fitness/Sports', 'WHO_I_WANT', 'I’d be interested in joining a sports league with a partner.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Fitness/Sports' AND question_stem = 'I’d be interested in joining a sports league with a partner.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Fitness/Sports' AND question_stem = 'I’d be interested in joining a sports league with a partner.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Dietary restrictions', 'WHO_I_WANT', 'I’d like to date a vegan.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Dietary restrictions' AND question_stem = 'I’d like to date a vegan.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Dietary restrictions' AND question_stem = 'I’d like to date a vegan.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Dietary restrictions', 'WHO_I_WANT', 'I''m okay with dating a picky eater.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Dietary restrictions' AND question_stem = 'I''m okay with dating a picky eater.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Dietary restrictions' AND question_stem = 'I''m okay with dating a picky eater.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Cultural Background', 'WHO_I_WANT', 'I''d prefer to date someone from my cultural background.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Cultural Background' AND question_stem = 'I''d prefer to date someone from my cultural background.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Cultural Background' AND question_stem = 'I''d prefer to date someone from my cultural background.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Cultural Background', 'WHO_I_WANT', 'Would you date someone from a very different culture?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Cultural Background' AND question_stem = 'Would you date someone from a very different culture?' LIMIT 1), 'Maybe, if it doesn’t conflict with my culture');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Cultural Background' AND question_stem = 'Would you date someone from a very different culture?' LIMIT 1), 'I would be open to it');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Cultural Background' AND question_stem = 'Would you date someone from a very different culture?' LIMIT 1), 'Probably not');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Cultural Background' AND question_stem = 'Would you date someone from a very different culture?' LIMIT 1), 'Prefer not to say');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Cultural Background', 'WHO_I_AM', 'I would adopt different cultural practices for the right person.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Cultural Background' AND question_stem = 'I would adopt different cultural practices for the right person.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Cultural Background' AND question_stem = 'I would adopt different cultural practices for the right person.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Open-mindedness', 'WHO_I_WANT', 'Lots of piercings?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Open-mindedness' AND question_stem = 'Lots of piercings?' LIMIT 1), 'Turn on');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Open-mindedness' AND question_stem = 'Lots of piercings?' LIMIT 1), 'Turn off');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Open-mindedness', 'WHO_I_WANT', 'Lots of tattoos?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Open-mindedness' AND question_stem = 'Lots of tattoos?' LIMIT 1), 'Turn on');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Open-mindedness' AND question_stem = 'Lots of tattoos?' LIMIT 1), 'Turn off');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Open-mindedness' AND question_stem = 'Lots of tattoos?' LIMIT 1), 'I don''t mind');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Open-mindedness' AND question_stem = 'Lots of tattoos?' LIMIT 1), 'Not sure');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Open-mindedness', 'WHO_I_WANT', 'Brightly dyed hair?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Open-mindedness' AND question_stem = 'Brightly dyed hair?' LIMIT 1), 'Turn on');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Open-mindedness' AND question_stem = 'Brightly dyed hair?' LIMIT 1), 'Turn off');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Open-mindedness' AND question_stem = 'Brightly dyed hair?' LIMIT 1), 'Not sure');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Adventurousness', 'WHO_I_WANT', 'Do you prefer to do indoor our outdoor activities with your partner?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Adventurousness' AND question_stem = 'Do you prefer to do indoor our outdoor activities with your partner?' LIMIT 1), 'Indoor activities');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Adventurousness' AND question_stem = 'Do you prefer to do indoor our outdoor activities with your partner?' LIMIT 1), 'Outdoor activities');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Adventurousness' AND question_stem = 'Do you prefer to do indoor our outdoor activities with your partner?' LIMIT 1), 'I like both');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Outdoor experiences', 'WHO_I_AM', 'How does an all-day hike sound?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Outdoor experiences' AND question_stem = 'How does an all-day hike sound?' LIMIT 1), 'Doable, I''ll live');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Outdoor experiences' AND question_stem = 'How does an all-day hike sound?' LIMIT 1), 'Awesome. Let’s go!');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Outdoor experiences' AND question_stem = 'How does an all-day hike sound?' LIMIT 1), 'Like my nightmare');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Outdoor experiences' AND question_stem = 'How does an all-day hike sound?' LIMIT 1), 'Not sure');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Ambition', 'WHO_I_WANT', 'Which would you prefer in a partner?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Ambition' AND question_stem = 'Which would you prefer in a partner?' LIMIT 1), 'They’re content with what they have');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Ambition' AND question_stem = 'Which would you prefer in a partner?' LIMIT 1), 'They’re driven to get ahead');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Ambition' AND question_stem = 'Which would you prefer in a partner?' LIMIT 1), 'Not sure');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Extroversion compatibility', 'WHO_I_WANT', 'I''d love to have an extroverted partner');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Extroversion compatibility' AND question_stem = 'I''d love to have an extroverted partner' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Extroversion compatibility' AND question_stem = 'I''d love to have an extroverted partner' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Extroversion compatibility', 'WHO_I_WANT', 'People with “big” or “loud” personalities are…');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Extroversion compatibility' AND question_stem = 'People with “big” or “loud” personalities are…' LIMIT 1), 'Annoying');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Extroversion compatibility' AND question_stem = 'People with “big” or “loud” personalities are…' LIMIT 1), 'Amusing');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Extroversion compatibility' AND question_stem = 'People with “big” or “loud” personalities are…' LIMIT 1), 'Not sure');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Extroversion compatibility', 'WHO_I_WANT', 'I''d be okay dating a very shy person.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Extroversion compatibility' AND question_stem = 'I''d be okay dating a very shy person.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Extroversion compatibility' AND question_stem = 'I''d be okay dating a very shy person.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Active lifestyle compatibility', 'WHO_I_AM', 'What time do you usually work out?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Active lifestyle compatibility' AND question_stem = 'What time do you usually work out?' LIMIT 1), 'Early morning');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Active lifestyle compatibility' AND question_stem = 'What time do you usually work out?' LIMIT 1), 'Mid-morning');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Active lifestyle compatibility' AND question_stem = 'What time do you usually work out?' LIMIT 1), 'Afternoon');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Active lifestyle compatibility' AND question_stem = 'What time do you usually work out?' LIMIT 1), 'Evening');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Active lifestyle compatibility' AND question_stem = 'What time do you usually work out?' LIMIT 1), 'I don''t workout');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Active lifestyle compatibility', 'WHO_I_WANT', 'It''s important that my partner is physically fit.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Active lifestyle compatibility' AND question_stem = 'It''s important that my partner is physically fit.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Active lifestyle compatibility' AND question_stem = 'It''s important that my partner is physically fit.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Alcohol consumption', 'WHO_I_AM', 'I prefer to meet dates for coffee over a drink.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Alcohol consumption' AND question_stem = 'I prefer to meet dates for coffee over a drink.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Alcohol consumption' AND question_stem = 'I prefer to meet dates for coffee over a drink.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Personality', 'WHO_I_AM', 'People often see me as a leader.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Personality' AND question_stem = 'People often see me as a leader.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Personality' AND question_stem = 'People often see me as a leader.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Attitudes toward monogamy/polyamory', 'WHO_I_AM', 'Your date asks to be polyamorous. How do you feel?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Attitudes toward monogamy/polyamory' AND question_stem = 'Your date asks to be polyamorous. How do you feel?' LIMIT 1), 'Relieved');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Attitudes toward monogamy/polyamory' AND question_stem = 'Your date asks to be polyamorous. How do you feel?' LIMIT 1), 'Overjoyed');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Attitudes toward monogamy/polyamory' AND question_stem = 'Your date asks to be polyamorous. How do you feel?' LIMIT 1), 'Anxious');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Attitudes toward monogamy/polyamory' AND question_stem = 'Your date asks to be polyamorous. How do you feel?' LIMIT 1), 'Disappointed');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Attitudes toward monogamy/polyamory' AND question_stem = 'Your date asks to be polyamorous. How do you feel?' LIMIT 1), 'Prefer not to say');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Attitudes toward monogamy/polyamory', 'WHO_I_WANT', 'I''m open to my partner going on dates with other people.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Attitudes toward monogamy/polyamory' AND question_stem = 'I''m open to my partner going on dates with other people.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Attitudes toward monogamy/polyamory' AND question_stem = 'I''m open to my partner going on dates with other people.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Conflict resolution', 'WHO_I_AM', 'You are upset with your partner. What''s your go-to move?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Conflict resolution' AND question_stem = 'You are upset with your partner. What''s your go-to move?' LIMIT 1), 'Talk it out immediately');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Conflict resolution' AND question_stem = 'You are upset with your partner. What''s your go-to move?' LIMIT 1), 'Take a break to cool down before talking about it');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Conflict resolution' AND question_stem = 'You are upset with your partner. What''s your go-to move?' LIMIT 1), 'Pretend everything is fine');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Conflict resolution', 'WHO_I_AM', 'Which are you most likely to say during an argument?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Conflict resolution' AND question_stem = 'Which are you most likely to say during an argument?' LIMIT 1), 'Let''s talk this out immediately');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Conflict resolution' AND question_stem = 'Which are you most likely to say during an argument?' LIMIT 1), 'I need time to decompress.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Conflict resolution' AND question_stem = 'Which are you most likely to say during an argument?' LIMIT 1), 'Let''s pick this up later.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Conflict resolution' AND question_stem = 'Which are you most likely to say during an argument?' LIMIT 1), 'It''s ok, we''re cool');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Current family situation', 'WHO_I_WANT', 'I''m open to dating someone with kids.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Current family situation' AND question_stem = 'I''m open to dating someone with kids.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Current family situation' AND question_stem = 'I''m open to dating someone with kids.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Current family situation', 'WHO_I_AM', 'Do you live with anyone? Choose all that apply.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Current family situation' AND question_stem = 'Do you live with anyone? Choose all that apply.' LIMIT 1), 'Just me, myself, and I');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Current family situation' AND question_stem = 'Do you live with anyone? Choose all that apply.' LIMIT 1), 'Family');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Current family situation' AND question_stem = 'Do you live with anyone? Choose all that apply.' LIMIT 1), 'Pet');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Current family situation' AND question_stem = 'Do you live with anyone? Choose all that apply.' LIMIT 1), 'Roommate');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Current family situation' AND question_stem = 'Do you live with anyone? Choose all that apply.' LIMIT 1), 'Ghost');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Current family situation', 'WHO_I_WANT', 'I''m a single parent.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Current family situation' AND question_stem = 'I''m a single parent.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Current family situation' AND question_stem = 'I''m a single parent.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Current family situation', 'WHO_I_AM', 'Do you have any siblings? Choose all that apply.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Current family situation' AND question_stem = 'Do you have any siblings? Choose all that apply.' LIMIT 1), 'I have 1 sibling');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Current family situation' AND question_stem = 'Do you have any siblings? Choose all that apply.' LIMIT 1), 'I''m an only child');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Current family situation' AND question_stem = 'Do you have any siblings? Choose all that apply.' LIMIT 1), 'I have 2+ siblings');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Current family situation' AND question_stem = 'Do you have any siblings? Choose all that apply.' LIMIT 1), 'I have a twin');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Current family situation' AND question_stem = 'Do you have any siblings? Choose all that apply.' LIMIT 1), 'I have an evil twin');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Daily routine compatibility', 'WHO_I_AM', 'I get up early in the morning.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Daily routine compatibility' AND question_stem = 'I get up early in the morning.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Daily routine compatibility' AND question_stem = 'I get up early in the morning.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Daily routine compatibility', 'WHO_I_AM', 'Keeping a regular sleep schedule is important.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Daily routine compatibility' AND question_stem = 'Keeping a regular sleep schedule is important.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Daily routine compatibility' AND question_stem = 'Keeping a regular sleep schedule is important.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Adventurousness', 'WHO_I_AM', 'When you say you like the outdoors, what do you actually mean?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Adventurousness' AND question_stem = 'When you say you like the outdoors, what do you actually mean?' LIMIT 1), 'Mountains, national parks, everything!');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Adventurousness' AND question_stem = 'When you say you like the outdoors, what do you actually mean?' LIMIT 1), 'I never said that');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Dietary restrictions', 'WHO_I_AM', 'I avoid eating or drinking dairy.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Dietary restrictions' AND question_stem = 'I avoid eating or drinking dairy.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Dietary restrictions' AND question_stem = 'I avoid eating or drinking dairy.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Dietary restrictions', 'WHO_I_AM', 'Do you adhere to a specific diet? Choose all that apply.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Dietary restrictions' AND question_stem = 'Do you adhere to a specific diet? Choose all that apply.' LIMIT 1), 'Ketogenic');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Dietary restrictions' AND question_stem = 'Do you adhere to a specific diet? Choose all that apply.' LIMIT 1), 'Halal');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Dietary restrictions' AND question_stem = 'Do you adhere to a specific diet? Choose all that apply.' LIMIT 1), 'Pescatarian');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Dietary restrictions' AND question_stem = 'Do you adhere to a specific diet? Choose all that apply.' LIMIT 1), 'Flexitarian');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Dietary restrictions' AND question_stem = 'Do you adhere to a specific diet? Choose all that apply.' LIMIT 1), 'Kosher');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Pastimes', 'WHO_I_AM', 'I like watching documentaries.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Pastimes' AND question_stem = 'I like watching documentaries.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Pastimes' AND question_stem = 'I like watching documentaries.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Family planning', 'WHO_I_WANT', 'I hope my partner would be open to adopting children.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Family planning' AND question_stem = 'I hope my partner would be open to adopting children.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Family planning' AND question_stem = 'I hope my partner would be open to adopting children.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Family values', 'WHO_I_AM', 'I''m close with my extended family or distant relatives.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Family values' AND question_stem = 'I''m close with my extended family or distant relatives.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Family values' AND question_stem = 'I''m close with my extended family or distant relatives.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Family values', 'WHO_I_AM', 'Family loyalty is more important than any other relationship.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Family values' AND question_stem = 'Family loyalty is more important than any other relationship.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Family values' AND question_stem = 'Family loyalty is more important than any other relationship.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Family values', 'WHO_I_AM', 'What are some family activities you enjoy? Choose all that apply.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Family values' AND question_stem = 'What are some family activities you enjoy? Choose all that apply.' LIMIT 1), 'Family dinner time');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Family values' AND question_stem = 'What are some family activities you enjoy? Choose all that apply.' LIMIT 1), 'Game nights');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Family values' AND question_stem = 'What are some family activities you enjoy? Choose all that apply.' LIMIT 1), 'Going on trips and vacations');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Family values' AND question_stem = 'What are some family activities you enjoy? Choose all that apply.' LIMIT 1), 'Watching movies or TV shows');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Family values' AND question_stem = 'What are some family activities you enjoy? Choose all that apply.' LIMIT 1), 'Celebrating holidays');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Family values', 'WHO_I_WANT', 'I''d find it cute if my partner talked to their siblings all the time.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Family values' AND question_stem = 'I''d find it cute if my partner talked to their siblings all the time.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Family values' AND question_stem = 'I''d find it cute if my partner talked to their siblings all the time.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Favorite Movie', 'WHO_I_WANT', 'My ideal partner must love Star Wars.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Favorite Movie' AND question_stem = 'My ideal partner must love Star Wars.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Favorite Movie' AND question_stem = 'My ideal partner must love Star Wars.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Favorite Movie', 'WHO_I_AM', 'What''s your favorite type of movie?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Favorite Movie' AND question_stem = 'What''s your favorite type of movie?' LIMIT 1), 'Animation');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Favorite Movie' AND question_stem = 'What''s your favorite type of movie?' LIMIT 1), 'Horror');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Favorite Movie' AND question_stem = 'What''s your favorite type of movie?' LIMIT 1), 'Action');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Favorite Movie' AND question_stem = 'What''s your favorite type of movie?' LIMIT 1), 'Romance');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Favorite Movie' AND question_stem = 'What''s your favorite type of movie?' LIMIT 1), 'Comedy');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Favorite Movie', 'WHO_I_AM', 'Seeing a movie is a great date idea. ');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Favorite Movie' AND question_stem = 'Seeing a movie is a great date idea. ' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Favorite Movie' AND question_stem = 'Seeing a movie is a great date idea. ' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Financial tendencies', 'WHO_I_WANT', 'I prefer to date someone who can stick to a budget.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Financial tendencies' AND question_stem = 'I prefer to date someone who can stick to a budget.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Financial tendencies' AND question_stem = 'I prefer to date someone who can stick to a budget.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Financial tendencies', 'WHO_I_WANT', 'I''d love to meet an investment enthusiast.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Financial tendencies' AND question_stem = 'I''d love to meet an investment enthusiast.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Financial tendencies' AND question_stem = 'I''d love to meet an investment enthusiast.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Fitness/Sports', 'WHO_I_AM', 'You win a free ticket to any sports event. What''s your pick?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Fitness/Sports' AND question_stem = 'You win a free ticket to any sports event. What''s your pick?' LIMIT 1), 'Tennis');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Fitness/Sports' AND question_stem = 'You win a free ticket to any sports event. What''s your pick?' LIMIT 1), 'Soccer');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Fitness/Sports' AND question_stem = 'You win a free ticket to any sports event. What''s your pick?' LIMIT 1), 'American football');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Fitness/Sports' AND question_stem = 'You win a free ticket to any sports event. What''s your pick?' LIMIT 1), 'Golf');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Fitness/Sports' AND question_stem = 'You win a free ticket to any sports event. What''s your pick?' LIMIT 1), 'Formula One');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Fitness/Sports' AND question_stem = 'You win a free ticket to any sports event. What''s your pick?' LIMIT 1), 'Hockey');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Fitness/Sports' AND question_stem = 'You win a free ticket to any sports event. What''s your pick?' LIMIT 1), 'Volleyball');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Fitness/Sports' AND question_stem = 'You win a free ticket to any sports event. What''s your pick?' LIMIT 1), 'Archery');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Fitness/Sports' AND question_stem = 'You win a free ticket to any sports event. What''s your pick?' LIMIT 1), 'MMA');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Fitness/Sports' AND question_stem = 'You win a free ticket to any sports event. What''s your pick?' LIMIT 1), 'Wrestling');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Fitness/Sports' AND question_stem = 'You win a free ticket to any sports event. What''s your pick?' LIMIT 1), 'Boxing');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Fitness/Sports' AND question_stem = 'You win a free ticket to any sports event. What''s your pick?' LIMIT 1), 'Basketball');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Fitness/Sports' AND question_stem = 'You win a free ticket to any sports event. What''s your pick?' LIMIT 1), 'Cricket');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Fitness/Sports' AND question_stem = 'You win a free ticket to any sports event. What''s your pick?' LIMIT 1), 'Figure skating');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Fitness/Sports' AND question_stem = 'You win a free ticket to any sports event. What''s your pick?' LIMIT 1), 'Baseball');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Fitness/Sports' AND question_stem = 'You win a free ticket to any sports event. What''s your pick?' LIMIT 1), 'None of the above');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Fitness/Sports', 'WHO_I_AM', 'Which sports do you like to play? Choose all that apply.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Fitness/Sports' AND question_stem = 'Which sports do you like to play? Choose all that apply.' LIMIT 1), 'Basketball');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Fitness/Sports' AND question_stem = 'Which sports do you like to play? Choose all that apply.' LIMIT 1), 'Tennis');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Fitness/Sports' AND question_stem = 'Which sports do you like to play? Choose all that apply.' LIMIT 1), 'Soccer');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Fitness/Sports' AND question_stem = 'Which sports do you like to play? Choose all that apply.' LIMIT 1), 'Rugby');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Fitness/Sports' AND question_stem = 'Which sports do you like to play? Choose all that apply.' LIMIT 1), 'Hockey');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Fitness/Sports' AND question_stem = 'Which sports do you like to play? Choose all that apply.' LIMIT 1), 'Roller skate');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Fitness/Sports' AND question_stem = 'Which sports do you like to play? Choose all that apply.' LIMIT 1), 'Boxing');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Fitness/Sports' AND question_stem = 'Which sports do you like to play? Choose all that apply.' LIMIT 1), 'Yoga');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Fitness/Sports' AND question_stem = 'Which sports do you like to play? Choose all that apply.' LIMIT 1), 'None of the above');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Independence', 'WHO_I_AM', 'You like to sometimes spend a day without your partner.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Independence' AND question_stem = 'You like to sometimes spend a day without your partner.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Independence' AND question_stem = 'You like to sometimes spend a day without your partner.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Hobby compatibility', 'WHO_I_AM', 'Are you interested in any of these hobbies? Choose all that apply. ');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Hobby compatibility' AND question_stem = 'Are you interested in any of these hobbies? Choose all that apply. ' LIMIT 1), 'Foraging');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Hobby compatibility' AND question_stem = 'Are you interested in any of these hobbies? Choose all that apply. ' LIMIT 1), 'Birding');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Hobby compatibility' AND question_stem = 'Are you interested in any of these hobbies? Choose all that apply. ' LIMIT 1), 'Antiquing');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Hobby compatibility' AND question_stem = 'Are you interested in any of these hobbies? Choose all that apply. ' LIMIT 1), 'Interior design');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Creative date preferences', 'WHO_I_AM', 'You like to work with your hands. ');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Creative date preferences' AND question_stem = 'You like to work with your hands. ' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Creative date preferences' AND question_stem = 'You like to work with your hands. ' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Hobby compatibility', 'WHO_I_AM', 'It''s important to share hobbies with the person you''re dating. ');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Hobby compatibility' AND question_stem = 'It''s important to share hobbies with the person you''re dating. ' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Hobby compatibility' AND question_stem = 'It''s important to share hobbies with the person you''re dating. ' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Money talks', 'WHO_I_WANT', 'You''d be more likely to consider a second date with someone who owns their own home. ');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Money talks' AND question_stem = 'You''d be more likely to consider a second date with someone who owns their own home. ' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Money talks' AND question_stem = 'You''d be more likely to consider a second date with someone who owns their own home. ' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Money talks', 'WHO_I_AM', 'You''re willing to take risks when investing.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Money talks' AND question_stem = 'You''re willing to take risks when investing.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Money talks' AND question_stem = 'You''re willing to take risks when investing.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Money talks', 'WHO_I_AM', 'You''d combine your finances with the right person.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Money talks' AND question_stem = 'You''d combine your finances with the right person.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Money talks' AND question_stem = 'You''d combine your finances with the right person.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Music', 'WHO_I_AM', 'Which music genres do you like? Choose all that apply.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Music' AND question_stem = 'Which music genres do you like? Choose all that apply.' LIMIT 1), 'Pop');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Music' AND question_stem = 'Which music genres do you like? Choose all that apply.' LIMIT 1), 'Rock & roll');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Music' AND question_stem = 'Which music genres do you like? Choose all that apply.' LIMIT 1), 'Jazz');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Music' AND question_stem = 'Which music genres do you like? Choose all that apply.' LIMIT 1), 'Hip hop');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Music' AND question_stem = 'Which music genres do you like? Choose all that apply.' LIMIT 1), 'Country');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Music', 'WHO_I_AM', 'Which music genres do you like? Choose all that apply.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Music' AND question_stem = 'Which music genres do you like? Choose all that apply.' LIMIT 1), 'Heavy metal');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Music' AND question_stem = 'Which music genres do you like? Choose all that apply.' LIMIT 1), 'K-pop');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Music' AND question_stem = 'Which music genres do you like? Choose all that apply.' LIMIT 1), 'Classical');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Music' AND question_stem = 'Which music genres do you like? Choose all that apply.' LIMIT 1), 'EDM');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Music', 'WHO_I_AM', 'Do you consider yourself a music lover?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Music' AND question_stem = 'Do you consider yourself a music lover?' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Music' AND question_stem = 'Do you consider yourself a music lover?' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Open-mindedness', 'WHO_I_WANT', 'You think tattoos are hot.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Open-mindedness' AND question_stem = 'You think tattoos are hot.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Open-mindedness' AND question_stem = 'You think tattoos are hot.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Open-mindedness', 'WHO_I_WANT', 'You want your partner to have piercings.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Open-mindedness' AND question_stem = 'You want your partner to have piercings.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Open-mindedness' AND question_stem = 'You want your partner to have piercings.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Open-mindedness', 'WHO_I_AM', 'You''re always down to try new kinds of food. ');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Open-mindedness' AND question_stem = 'You''re always down to try new kinds of food. ' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Open-mindedness' AND question_stem = 'You''re always down to try new kinds of food. ' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Pastimes', 'WHO_I_AM', 'You''re pretty handy around the house. ');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Pastimes' AND question_stem = 'You''re pretty handy around the house. ' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Pastimes' AND question_stem = 'You''re pretty handy around the house. ' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Pastimes', 'WHO_I_AM', 'You know how to operate power tools. ');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Pastimes' AND question_stem = 'You know how to operate power tools. ' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Pastimes' AND question_stem = 'You know how to operate power tools. ' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Pastimes', 'WHO_I_WANT', 'Does it matter to you if your partner is handy around the house?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Pastimes' AND question_stem = 'Does it matter to you if your partner is handy around the house?' LIMIT 1), 'It''d be a nice bonus');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Pastimes' AND question_stem = 'Does it matter to you if your partner is handy around the house?' LIMIT 1), 'Not really');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Pastimes' AND question_stem = 'Does it matter to you if your partner is handy around the house?' LIMIT 1), 'Yes! I need the help');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Pastimes' AND question_stem = 'Does it matter to you if your partner is handy around the house?' LIMIT 1), 'Not sure');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Pastimes', 'WHO_I_WANT', 'You''d be thrilled if your date enjoyed these hobbies. Choose all that apply.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Pastimes' AND question_stem = 'You''d be thrilled if your date enjoyed these hobbies. Choose all that apply.' LIMIT 1), 'Gardening');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Pastimes' AND question_stem = 'You''d be thrilled if your date enjoyed these hobbies. Choose all that apply.' LIMIT 1), 'Reading');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Pastimes' AND question_stem = 'You''d be thrilled if your date enjoyed these hobbies. Choose all that apply.' LIMIT 1), 'Journaling');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Pastimes' AND question_stem = 'You''d be thrilled if your date enjoyed these hobbies. Choose all that apply.' LIMIT 1), 'Shopping');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Pastimes' AND question_stem = 'You''d be thrilled if your date enjoyed these hobbies. Choose all that apply.' LIMIT 1), 'Volunteering');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Personality', 'WHO_I_AM', 'You think white lies are totally fine. ');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Personality' AND question_stem = 'You think white lies are totally fine. ' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Personality' AND question_stem = 'You think white lies are totally fine. ' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Personality', 'WHO_I_AM', 'Who are you in your friend group?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Personality' AND question_stem = 'Who are you in your friend group?' LIMIT 1), 'The jokester who makes others laugh');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Personality' AND question_stem = 'Who are you in your friend group?' LIMIT 1), 'The one who works out all the time');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Personality' AND question_stem = 'Who are you in your friend group?' LIMIT 1), 'The one with a plan for everything');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Personality' AND question_stem = 'Who are you in your friend group?' LIMIT 1), 'The smart one everyone turns to');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Personality' AND question_stem = 'Who are you in your friend group?' LIMIT 1), 'The energizing cheerleader');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Personality', 'WHO_I_WANT', 'You tend to enjoy dating nerds.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Personality' AND question_stem = 'You tend to enjoy dating nerds.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Personality' AND question_stem = 'You tend to enjoy dating nerds.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Personality', 'WHO_I_WANT', 'What''s one quality you absolutely can''t compromise on in a partner?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Personality' AND question_stem = 'What''s one quality you absolutely can''t compromise on in a partner?' LIMIT 1), 'Total honesty');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Personality' AND question_stem = 'What''s one quality you absolutely can''t compromise on in a partner?' LIMIT 1), 'Sense of humor');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Personality' AND question_stem = 'What''s one quality you absolutely can''t compromise on in a partner?' LIMIT 1), 'Sense of optimism');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Personality' AND question_stem = 'What''s one quality you absolutely can''t compromise on in a partner?' LIMIT 1), 'Intelligence');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Personality' AND question_stem = 'What''s one quality you absolutely can''t compromise on in a partner?' LIMIT 1), 'Kindness');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Personality', 'WHO_I_AM', 'Pick one thing you''d list as your top strength on your resume.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Personality' AND question_stem = 'Pick one thing you''d list as your top strength on your resume.' LIMIT 1), 'Self-motivated');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Personality' AND question_stem = 'Pick one thing you''d list as your top strength on your resume.' LIMIT 1), 'Organized and detail-oriented');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Personality' AND question_stem = 'Pick one thing you''d list as your top strength on your resume.' LIMIT 1), 'Problem-solver');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Personality' AND question_stem = 'Pick one thing you''d list as your top strength on your resume.' LIMIT 1), 'Empathetic');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Personality' AND question_stem = 'Pick one thing you''d list as your top strength on your resume.' LIMIT 1), 'Decisive');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Personality', 'WHO_I_AM', 'How would you describe your sense of humor?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Personality' AND question_stem = 'How would you describe your sense of humor?' LIMIT 1), 'I''m fluent in sarcasm');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Personality' AND question_stem = 'How would you describe your sense of humor?' LIMIT 1), 'I specialize in dad jokes');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Personality' AND question_stem = 'How would you describe your sense of humor?' LIMIT 1), 'I thrive on dark humor');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Personality' AND question_stem = 'How would you describe your sense of humor?' LIMIT 1), 'Self-deprecating');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Personality' AND question_stem = 'How would you describe your sense of humor?' LIMIT 1), 'Dry wit');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Relationship Values', 'WHO_I_WANT', 'I want a partner who can hold their own in a conversation.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Relationship Values' AND question_stem = 'I want a partner who can hold their own in a conversation.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Relationship Values' AND question_stem = 'I want a partner who can hold their own in a conversation.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Personality', 'WHO_I_WANT', 'You want to meet someone with golden retriever energy.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Personality' AND question_stem = 'You want to meet someone with golden retriever energy.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Personality' AND question_stem = 'You want to meet someone with golden retriever energy.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Relationship Values', 'WHO_I_AM', 'Is it necessary to have shared values with everyone you date?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Relationship Values' AND question_stem = 'Is it necessary to have shared values with everyone you date?' LIMIT 1), 'Unnecessary');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Relationship Values' AND question_stem = 'Is it necessary to have shared values with everyone you date?' LIMIT 1), 'Nice to have');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Relationship Values' AND question_stem = 'Is it necessary to have shared values with everyone you date?' LIMIT 1), 'Needed at most times');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Relationship Values' AND question_stem = 'Is it necessary to have shared values with everyone you date?' LIMIT 1), 'Essential');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Relationship Values', 'WHO_I_AM', 'What do you bring to a date?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Relationship Values' AND question_stem = 'What do you bring to a date?' LIMIT 1), 'Excitement');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Relationship Values' AND question_stem = 'What do you bring to a date?' LIMIT 1), 'Great conversation');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Relationship Values' AND question_stem = 'What do you bring to a date?' LIMIT 1), 'Great listener');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Relationship Values' AND question_stem = 'What do you bring to a date?' LIMIT 1), 'I''m funny');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Relationship Values' AND question_stem = 'What do you bring to a date?' LIMIT 1), 'Maturity');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Relationship Values', 'WHO_I_WANT', 'What are you looking for in a partner?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Relationship Values' AND question_stem = 'What are you looking for in a partner?' LIMIT 1), 'A great listener');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Relationship Values' AND question_stem = 'What are you looking for in a partner?' LIMIT 1), 'Someone I can trust');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Relationship Values' AND question_stem = 'What are you looking for in a partner?' LIMIT 1), 'Someone who inspires me');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Relationship Values' AND question_stem = 'What are you looking for in a partner?' LIMIT 1), 'A hottie');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Relationship Values' AND question_stem = 'What are you looking for in a partner?' LIMIT 1), 'An intellectual equal');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Alcohol consumption', 'WHO_I_AM', 'You love wine.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Alcohol consumption' AND question_stem = 'You love wine.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Alcohol consumption' AND question_stem = 'You love wine.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Food preference', 'WHO_I_AM', 'You love seafood.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Food preference' AND question_stem = 'You love seafood.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Food preference' AND question_stem = 'You love seafood.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Food preference', 'WHO_I_AM', 'You''d splurge on a special meal');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Food preference' AND question_stem = 'You''d splurge on a special meal' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Food preference' AND question_stem = 'You''d splurge on a special meal' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Dining compatibility', 'WHO_I_AM', 'You''ll try any type of food once.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Dining compatibility' AND question_stem = 'You''ll try any type of food once.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Dining compatibility' AND question_stem = 'You''ll try any type of food once.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Dining compatibility', 'WHO_I_AM', 'At restaurants, do you like to share your food?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Dining compatibility' AND question_stem = 'At restaurants, do you like to share your food?' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Dining compatibility' AND question_stem = 'At restaurants, do you like to share your food?' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Family planning', 'WHO_I_AM', 'You want to have a big family.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Family planning' AND question_stem = 'You want to have a big family.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Family planning' AND question_stem = 'You want to have a big family.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Family planning', 'WHO_I_AM', 'You''re open to becoming a foster parent. ');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Family planning' AND question_stem = 'You''re open to becoming a foster parent. ' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Family planning' AND question_stem = 'You''re open to becoming a foster parent. ' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Family planning', 'WHO_I_AM', 'You''re willing to be a stepparent.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Family planning' AND question_stem = 'You''re willing to be a stepparent.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Family planning' AND question_stem = 'You''re willing to be a stepparent.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Fitness/Sports', 'WHO_I_AM', 'You enjoy casual team sports.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Fitness/Sports' AND question_stem = 'You enjoy casual team sports.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Fitness/Sports' AND question_stem = 'You enjoy casual team sports.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Organization', 'WHO_I_AM', 'You consider yourself a minimalist.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Organization' AND question_stem = 'You consider yourself a minimalist.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Organization' AND question_stem = 'You consider yourself a minimalist.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Hobby compatibility', 'WHO_I_AM', 'You''d keep your hobbies private, even if your partner wanted to join. ');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Hobby compatibility' AND question_stem = 'You''d keep your hobbies private, even if your partner wanted to join. ' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Hobby compatibility' AND question_stem = 'You''d keep your hobbies private, even if your partner wanted to join. ' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Love language', 'WHO_I_WANT', 'You are a hugger.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Love language' AND question_stem = 'You are a hugger.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Love language' AND question_stem = 'You are a hugger.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Financial tendencies', 'WHO_I_AM', 'You stick to a strict budget.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Financial tendencies' AND question_stem = 'You stick to a strict budget.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Financial tendencies' AND question_stem = 'You stick to a strict budget.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Dining compatibility', 'WHO_I_AM', 'You love spicy food.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Dining compatibility' AND question_stem = 'You love spicy food.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Dining compatibility' AND question_stem = 'You love spicy food.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Money talks', 'WHO_I_AM', 'You’d rather spend money on experiences than material things.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Money talks' AND question_stem = 'You’d rather spend money on experiences than material things.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Money talks' AND question_stem = 'You’d rather spend money on experiences than material things.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Money talks', 'WHO_I_AM', 'You love it when you find a great discount or coupon.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Money talks' AND question_stem = 'You love it when you find a great discount or coupon.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Money talks' AND question_stem = 'You love it when you find a great discount or coupon.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Money talks', 'WHO_I_AM', 'You always haggle for a better deal.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Money talks' AND question_stem = 'You always haggle for a better deal.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Money talks' AND question_stem = 'You always haggle for a better deal.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Social views', 'WHO_I_AM', 'You look forward to LGBTQ+ Pride Month.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Social views' AND question_stem = 'You look forward to LGBTQ+ Pride Month.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Social views' AND question_stem = 'You look forward to LGBTQ+ Pride Month.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Gaming compatibility', 'WHO_I_AM', 'You love video games.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Gaming compatibility' AND question_stem = 'You love video games.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Gaming compatibility' AND question_stem = 'You love video games.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Music', 'WHO_I_AM', 'You enjoy singing.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Music' AND question_stem = 'You enjoy singing.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Music' AND question_stem = 'You enjoy singing.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Social views', 'WHO_I_AM', 'You think wealthy people should pay higher taxes.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Social views' AND question_stem = 'You think wealthy people should pay higher taxes.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Social views' AND question_stem = 'You think wealthy people should pay higher taxes.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Pastimes', 'WHO_I_AM', 'You find joy in teaching and sharing your knowledge.
');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Pastimes' AND question_stem = 'You find joy in teaching and sharing your knowledge.
' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Pastimes' AND question_stem = 'You find joy in teaching and sharing your knowledge.
' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Independence', 'WHO_I_AM', 'It''s important to you that you get to meet your long term partner''s friends. ');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Independence' AND question_stem = 'It''s important to you that you get to meet your long term partner''s friends. ' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Independence' AND question_stem = 'It''s important to you that you get to meet your long term partner''s friends. ' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Cooking', 'WHO_I_AM', 'Not knowing how to cook is a red flag for me.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Cooking' AND question_stem = 'Not knowing how to cook is a red flag for me.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Cooking' AND question_stem = 'Not knowing how to cook is a red flag for me.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Cooking', 'WHO_I_AM', 'When you cook, you tend to follow the recipe. ');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Cooking' AND question_stem = 'When you cook, you tend to follow the recipe. ' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Cooking' AND question_stem = 'When you cook, you tend to follow the recipe. ' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Cooking', 'WHO_I_AM', 'When you cook, it''s mainly because…');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Cooking' AND question_stem = 'When you cook, it''s mainly because…' LIMIT 1), 'Homemade meals are more budget friendly.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Cooking' AND question_stem = 'When you cook, it''s mainly because…' LIMIT 1), 'I genuinely enjoy cooking.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Cooking' AND question_stem = 'When you cook, it''s mainly because…' LIMIT 1), 'I need to follow a strict diet.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Cooking' AND question_stem = 'When you cook, it''s mainly because…' LIMIT 1), 'To feed someone else.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Cooking' AND question_stem = 'When you cook, it''s mainly because…' LIMIT 1), 'Just one of the chores I have to do.');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Pastimes', 'WHO_I_AM', 'You actively seek out new scientific facts for fun.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Pastimes' AND question_stem = 'You actively seek out new scientific facts for fun.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Pastimes' AND question_stem = 'You actively seek out new scientific facts for fun.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Pet friendliness', 'WHO_I_AM', 'I''m a proud plant parent.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Pet friendliness' AND question_stem = 'I''m a proud plant parent.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Pet friendliness' AND question_stem = 'I''m a proud plant parent.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Smoking', 'WHO_I_AM', 'I vape.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Smoking' AND question_stem = 'I vape.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Smoking' AND question_stem = 'I vape.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Creative date preferences', 'WHO_I_AM', 'What would you like to spend time doing?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Creative date preferences' AND question_stem = 'What would you like to spend time doing?' LIMIT 1), 'Watching a dance performance');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Creative date preferences' AND question_stem = 'What would you like to spend time doing?' LIMIT 1), 'Attending a concert');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Creative date preferences' AND question_stem = 'What would you like to spend time doing?' LIMIT 1), 'Getting crafty with a hands-on project');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Creative date preferences' AND question_stem = 'What would you like to spend time doing?' LIMIT 1), 'Exploring a famous art gallery');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Creative date preferences' AND question_stem = 'What would you like to spend time doing?' LIMIT 1), 'Attending a sporting event');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Dating intention', 'WHO_I_AM', 'A long distance relationship is worth the try.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Dating intention' AND question_stem = 'A long distance relationship is worth the try.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Dating intention' AND question_stem = 'A long distance relationship is worth the try.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Dating intention', 'WHO_I_AM', 'How far are you willing to travel to meet your date?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Dating intention' AND question_stem = 'How far are you willing to travel to meet your date?' LIMIT 1), 'Preferably within walking distance');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Dating intention' AND question_stem = 'How far are you willing to travel to meet your date?' LIMIT 1), 'Within 30 minutes by car');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Dating intention' AND question_stem = 'How far are you willing to travel to meet your date?' LIMIT 1), 'Maybe an hour or so by car');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Dating intention' AND question_stem = 'How far are you willing to travel to meet your date?' LIMIT 1), 'For the one, I''d hop on a plane');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Dating intention' AND question_stem = 'How far are you willing to travel to meet your date?' LIMIT 1), 'Not sure');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Dating intention', 'WHO_I_AM', 'Would you date someone you were friends with first?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Dating intention' AND question_stem = 'Would you date someone you were friends with first?' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Dating intention' AND question_stem = 'Would you date someone you were friends with first?' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Dating intention', 'WHO_I_AM', 'Having multiple situationships is basically cheating.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Dating intention' AND question_stem = 'Having multiple situationships is basically cheating.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Dating intention' AND question_stem = 'Having multiple situationships is basically cheating.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Dating intention', 'WHO_I_AM', 'Most of my relationships started out as friends first.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Dating intention' AND question_stem = 'Most of my relationships started out as friends first.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Dating intention' AND question_stem = 'Most of my relationships started out as friends first.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Love language', 'WHO_I_AM', 'What should your partner do when you need to vent?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Love language' AND question_stem = 'What should your partner do when you need to vent?' LIMIT 1), 'Listen and let me talk it out');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Love language' AND question_stem = 'What should your partner do when you need to vent?' LIMIT 1), 'Help me find a solution');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Love language' AND question_stem = 'What should your partner do when you need to vent?' LIMIT 1), 'Always take my side');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Love language' AND question_stem = 'What should your partner do when you need to vent?' LIMIT 1), 'Offer me a comforting hug');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Love language' AND question_stem = 'What should your partner do when you need to vent?' LIMIT 1), 'Cheer me up with gifts or food');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Artistry', 'WHO_I_AM', 'Art plays an important role in my life.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Artistry' AND question_stem = 'Art plays an important role in my life.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Artistry' AND question_stem = 'Art plays an important role in my life.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Active lifestyle compatibility', 'WHO_I_AM', 'You believe a person''s fitness is a reflection of their character.        ');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Active lifestyle compatibility' AND question_stem = 'You believe a person''s fitness is a reflection of their character.        ' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Active lifestyle compatibility' AND question_stem = 'You believe a person''s fitness is a reflection of their character.        ' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Active lifestyle compatibility', 'WHO_I_AM', 'What do you mainly exercise for? Choose all that apply.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Active lifestyle compatibility' AND question_stem = 'What do you mainly exercise for? Choose all that apply.' LIMIT 1), 'It helps me de-stress');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Active lifestyle compatibility' AND question_stem = 'What do you mainly exercise for? Choose all that apply.' LIMIT 1), 'I want to look fit');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Active lifestyle compatibility' AND question_stem = 'What do you mainly exercise for? Choose all that apply.' LIMIT 1), 'For my health');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Active lifestyle compatibility' AND question_stem = 'What do you mainly exercise for? Choose all that apply.' LIMIT 1), 'Exercise is my job');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Active lifestyle compatibility', 'WHO_I_AM', 'Where do you prefer to work out?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Active lifestyle compatibility' AND question_stem = 'Where do you prefer to work out?' LIMIT 1), 'Gym');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Active lifestyle compatibility' AND question_stem = 'Where do you prefer to work out?' LIMIT 1), 'Studio or class');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Active lifestyle compatibility' AND question_stem = 'Where do you prefer to work out?' LIMIT 1), 'Home');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Active lifestyle compatibility' AND question_stem = 'Where do you prefer to work out?' LIMIT 1), 'Outdoors');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Active lifestyle compatibility', 'WHO_I_AM', 'You''d rather do cardio than weights.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Active lifestyle compatibility' AND question_stem = 'You''d rather do cardio than weights.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Active lifestyle compatibility' AND question_stem = 'You''d rather do cardio than weights.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Active lifestyle compatibility', 'WHO_I_AM', 'You''d sign up for a group exercise class.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Active lifestyle compatibility' AND question_stem = 'You''d sign up for a group exercise class.' LIMIT 1), 'Sure, sounds fun!');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Active lifestyle compatibility' AND question_stem = 'You''d sign up for a group exercise class.' LIMIT 1), 'Maybe, if someone joins me');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Active lifestyle compatibility' AND question_stem = 'You''d sign up for a group exercise class.' LIMIT 1), 'Never');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Active lifestyle compatibility' AND question_stem = 'You''d sign up for a group exercise class.' LIMIT 1), 'Not sure');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Fitness/Sports', 'WHO_I_AM', 'You like playing pool.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Fitness/Sports' AND question_stem = 'You like playing pool.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Fitness/Sports' AND question_stem = 'You like playing pool.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Fitness/Sports', 'WHO_I_AM', 'You would watch a mixed martial arts tournament.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Fitness/Sports' AND question_stem = 'You would watch a mixed martial arts tournament.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Fitness/Sports' AND question_stem = 'You would watch a mixed martial arts tournament.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Fitness/Sports', 'WHO_I_WANT', 'You enjoy watching sports');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Fitness/Sports' AND question_stem = 'You enjoy watching sports' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Fitness/Sports' AND question_stem = 'You enjoy watching sports' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Fitness/Sports', 'WHO_I_AM', 'Do you follow any of these sports closely? Choose all that apply.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Fitness/Sports' AND question_stem = 'Do you follow any of these sports closely? Choose all that apply.' LIMIT 1), 'Basketball');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Fitness/Sports' AND question_stem = 'Do you follow any of these sports closely? Choose all that apply.' LIMIT 1), 'Baseball');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Fitness/Sports' AND question_stem = 'Do you follow any of these sports closely? Choose all that apply.' LIMIT 1), 'Football');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Fitness/Sports' AND question_stem = 'Do you follow any of these sports closely? Choose all that apply.' LIMIT 1), 'Tennis');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Fitness/Sports' AND question_stem = 'Do you follow any of these sports closely? Choose all that apply.' LIMIT 1), 'Cricket');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Religion', 'WHO_I_AM', 'You believe in Karma');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Religion' AND question_stem = 'You believe in Karma' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Religion' AND question_stem = 'You believe in Karma' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Religion', 'WHO_I_AM', 'What best describes you in your spiritual journey?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Religion' AND question_stem = 'What best describes you in your spiritual journey?' LIMIT 1), 'I follow a specific religion');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Religion' AND question_stem = 'What best describes you in your spiritual journey?' LIMIT 1), 'I believe in something beyond the physical');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Religion' AND question_stem = 'What best describes you in your spiritual journey?' LIMIT 1), 'I believe in what''s tangible and measurable');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Religion' AND question_stem = 'What best describes you in your spiritual journey?' LIMIT 1), 'I don''t really have strong beliefs either way.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Religion' AND question_stem = 'What best describes you in your spiritual journey?' LIMIT 1), 'Prefer not to say');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Political alignment', 'WHO_I_WANT', 'You''d date someone who doesn''t follow politics.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Political alignment' AND question_stem = 'You''d date someone who doesn''t follow politics.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Political alignment' AND question_stem = 'You''d date someone who doesn''t follow politics.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Political alignment', 'WHO_I_AM', 'When a friend regularly voices their political views on social media, how do you usually feel?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Political alignment' AND question_stem = 'When a friend regularly voices their political views on social media, how do you usually feel?' LIMIT 1), 'Curious and engaged');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Political alignment' AND question_stem = 'When a friend regularly voices their political views on social media, how do you usually feel?' LIMIT 1), 'Secretly tired of their posts');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Political alignment' AND question_stem = 'When a friend regularly voices their political views on social media, how do you usually feel?' LIMIT 1), 'Unsure what they''re talking about');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Political alignment' AND question_stem = 'When a friend regularly voices their political views on social media, how do you usually feel?' LIMIT 1), 'Honestly indifferent');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Political alignment' AND question_stem = 'When a friend regularly voices their political views on social media, how do you usually feel?' LIMIT 1), 'None of the above');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Cultural Background', 'WHO_I_AM', 'I''d date someone who''s not fluent in my language.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Cultural Background' AND question_stem = 'I''d date someone who''s not fluent in my language.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Cultural Background' AND question_stem = 'I''d date someone who''s not fluent in my language.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Creative date preferences', 'WHO_I_AM', 'I have a creative hobby I do often.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Creative date preferences' AND question_stem = 'I have a creative hobby I do often.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Creative date preferences' AND question_stem = 'I have a creative hobby I do often.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Cultural Background', 'WHO_I_AM', 'I have lived in different countries.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Cultural Background' AND question_stem = 'I have lived in different countries.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Cultural Background' AND question_stem = 'I have lived in different countries.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Cultural Background', 'WHO_I_AM', 'When you come across a new language and you find it interesting, you…');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Cultural Background' AND question_stem = 'When you come across a new language and you find it interesting, you…' LIMIT 1), 'Always pick up a phrase or two for fun');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Cultural Background' AND question_stem = 'When you come across a new language and you find it interesting, you…' LIMIT 1), 'Often feel the urge to learn it');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Cultural Background' AND question_stem = 'When you come across a new language and you find it interesting, you…' LIMIT 1), 'Try to figure out what it is but not necessarily learn it');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Cultural Background' AND question_stem = 'When you come across a new language and you find it interesting, you…' LIMIT 1), 'None of the above');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Open-mindedness', 'WHO_I_AM', 'When I go to a restaurant, I tend to always order the same thing.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Open-mindedness' AND question_stem = 'When I go to a restaurant, I tend to always order the same thing.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Open-mindedness' AND question_stem = 'When I go to a restaurant, I tend to always order the same thing.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Pet friendliness', 'WHO_I_WANT', 'My partner definitely needs to love dogs.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Pet friendliness' AND question_stem = 'My partner definitely needs to love dogs.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Pet friendliness' AND question_stem = 'My partner definitely needs to love dogs.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Pet friendliness', 'WHO_I_WANT', 'My partner definitely needs to love cats.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Pet friendliness' AND question_stem = 'My partner definitely needs to love cats.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Pet friendliness' AND question_stem = 'My partner definitely needs to love cats.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Work vibes', 'WHO_I_AM', 'I own a business.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Work vibes' AND question_stem = 'I own a business.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Work vibes' AND question_stem = 'I own a business.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Work vibes', 'WHO_I_WANT', 'I want my partner and I to have similar work schedules.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Work vibes' AND question_stem = 'I want my partner and I to have similar work schedules.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Work vibes' AND question_stem = 'I want my partner and I to have similar work schedules.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Food preference', 'WHO_I_WANT', 'I''d date someone who doesn''t drink coffee.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Food preference' AND question_stem = 'I''d date someone who doesn''t drink coffee.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Food preference' AND question_stem = 'I''d date someone who doesn''t drink coffee.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Food preference', 'WHO_I_WANT', 'I''d date someone who doesn''t eat meat.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Food preference' AND question_stem = 'I''d date someone who doesn''t eat meat.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Food preference' AND question_stem = 'I''d date someone who doesn''t eat meat.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Personality', 'WHO_I_AM', 'I like it when people talk about deeply personal things.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Personality' AND question_stem = 'I like it when people talk about deeply personal things.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Personality' AND question_stem = 'I like it when people talk about deeply personal things.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Pastimes', 'WHO_I_AM', 'Which activity do you feel most drawn to?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Pastimes' AND question_stem = 'Which activity do you feel most drawn to?' LIMIT 1), 'Reading a book');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Pastimes' AND question_stem = 'Which activity do you feel most drawn to?' LIMIT 1), 'Having a lively debate');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Pastimes' AND question_stem = 'Which activity do you feel most drawn to?' LIMIT 1), 'Teaching or mentoring others');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Pastimes' AND question_stem = 'Which activity do you feel most drawn to?' LIMIT 1), 'Learning a new skill');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Pastimes' AND question_stem = 'Which activity do you feel most drawn to?' LIMIT 1), 'Watching tv or a movie');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Personality', 'WHO_I_AM', 'My friend group often turns to me to handle a problem.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Personality' AND question_stem = 'My friend group often turns to me to handle a problem.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Personality' AND question_stem = 'My friend group often turns to me to handle a problem.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Personality', 'WHO_I_WANT', 'It''s very important to me that my date is willing to try new things.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Personality' AND question_stem = 'It''s very important to me that my date is willing to try new things.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Personality' AND question_stem = 'It''s very important to me that my date is willing to try new things.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Personality', 'WHO_I_WANT', 'I''m an optimist. ');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Personality' AND question_stem = 'I''m an optimist. ' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Personality' AND question_stem = 'I''m an optimist. ' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Personality', 'WHO_I_WANT', 'I''d actually love to date someone who''s got a plan for everything.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Personality' AND question_stem = 'I''d actually love to date someone who''s got a plan for everything.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Personality' AND question_stem = 'I''d actually love to date someone who''s got a plan for everything.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Career priorities', 'WHO_I_WANT', 'Would it be okay if your partner worked on weekends?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Career priorities' AND question_stem = 'Would it be okay if your partner worked on weekends?' LIMIT 1), 'Yes, if they still have time for me');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Career priorities' AND question_stem = 'Would it be okay if your partner worked on weekends?' LIMIT 1), 'Only if it''s temporary');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Career priorities' AND question_stem = 'Would it be okay if your partner worked on weekends?' LIMIT 1), 'Yes, I understand work comes first');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Career priorities' AND question_stem = 'Would it be okay if your partner worked on weekends?' LIMIT 1), 'No, I''d absolutely hate it');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Career priorities' AND question_stem = 'Would it be okay if your partner worked on weekends?' LIMIT 1), 'Not sure');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Career priorities', 'WHO_I_AM', 'In terms of career, I know what I want to do in the next 5 years.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Career priorities' AND question_stem = 'In terms of career, I know what I want to do in the next 5 years.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Career priorities' AND question_stem = 'In terms of career, I know what I want to do in the next 5 years.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Career priorities', 'WHO_I_AM', 'I''d move far away from family and friends for a dream job.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Career priorities' AND question_stem = 'I''d move far away from family and friends for a dream job.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Career priorities' AND question_stem = 'I''d move far away from family and friends for a dream job.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Smoking', 'WHO_I_AM', 'Cigarette smoke doesn''t bother me.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Smoking' AND question_stem = 'Cigarette smoke doesn''t bother me.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Smoking' AND question_stem = 'Cigarette smoke doesn''t bother me.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Smoking', 'WHO_I_WANT', 'I would date someone who smokes cigarettes.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Smoking' AND question_stem = 'I would date someone who smokes cigarettes.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Smoking' AND question_stem = 'I would date someone who smokes cigarettes.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Smoking', 'WHO_I_WANT', 'I would date someone who vapes.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Smoking' AND question_stem = 'I would date someone who vapes.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Smoking' AND question_stem = 'I would date someone who vapes.' LIMIT 1), 'Yes');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Adventurousness', 'WHO_I_AM', 'You have to spend the entire day outside! Your reaction?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Adventurousness' AND question_stem = 'You have to spend the entire day outside! Your reaction?' LIMIT 1), '[Stressed noises]');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Adventurousness' AND question_stem = 'You have to spend the entire day outside! Your reaction?' LIMIT 1), 'I think I''d survive');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Adventurousness' AND question_stem = 'You have to spend the entire day outside! Your reaction?' LIMIT 1), 'Sounds fun, what could go wrong?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Adventurousness' AND question_stem = 'You have to spend the entire day outside! Your reaction?' LIMIT 1), 'I''m the one who came up with the idea');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Adventurousness' AND question_stem = 'You have to spend the entire day outside! Your reaction?' LIMIT 1), 'None of the above');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Outdoor experiences', 'WHO_I_AM', 'What''s your perfect outdoor date?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Outdoor experiences' AND question_stem = 'What''s your perfect outdoor date?' LIMIT 1), 'Something chill, like a picnic');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Outdoor experiences' AND question_stem = 'What''s your perfect outdoor date?' LIMIT 1), 'Hiking to a secret waterfall');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Outdoor experiences' AND question_stem = 'What''s your perfect outdoor date?' LIMIT 1), 'Camping under the stars');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Outdoor experiences' AND question_stem = 'What''s your perfect outdoor date?' LIMIT 1), 'Sitting on a park bench, feeding ducks');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Outdoor experiences' AND question_stem = 'What''s your perfect outdoor date?' LIMIT 1), 'Exploring a new neighborhood in the city');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Outdoor experiences', 'WHO_I_AM', 'Would you rather camp or glamp?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Outdoor experiences' AND question_stem = 'Would you rather camp or glamp?' LIMIT 1), 'Camp. I could live in the woods!');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Outdoor experiences' AND question_stem = 'Would you rather camp or glamp?' LIMIT 1), 'Glamp. Nature''s great, but so are hot showers.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Outdoor experiences' AND question_stem = 'Would you rather camp or glamp?' LIMIT 1), 'Why leave the comfort of my home?!');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Outdoor experiences', 'WHO_I_AM', 'What''s your perfect picnic spot?');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Outdoor experiences' AND question_stem = 'What''s your perfect picnic spot?' LIMIT 1), 'Quiet meadow');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Outdoor experiences' AND question_stem = 'What''s your perfect picnic spot?' LIMIT 1), 'Top of a mountain');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Outdoor experiences' AND question_stem = 'What''s your perfect picnic spot?' LIMIT 1), 'My backyard. No fuss, just snacks');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Outdoor experiences' AND question_stem = 'What''s your perfect picnic spot?' LIMIT 1), 'No picnics for me');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Outdoor experiences' AND question_stem = 'What''s your perfect picnic spot?' LIMIT 1), 'Near a waterfall');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Outdoor experiences', 'WHO_I_AM', 'Sunrise hike!');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Outdoor experiences' AND question_stem = 'Sunrise hike!' LIMIT 1), 'Bring it on, this is living!');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Outdoor experiences' AND question_stem = 'Sunrise hike!' LIMIT 1), 'There''s never a good time to hike');

INSERT INTO Question (insight_subject, insight_direction, question_stem) VALUES ('Creative date preferences', 'WHO_I_AM', 'I''d gladly visit a museum on the weekend.');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Creative date preferences' AND question_stem = 'I''d gladly visit a museum on the weekend.' LIMIT 1), 'No');
INSERT INTO Answer (question_id, answer_text) VALUES ((SELECT id FROM Question WHERE insight_subject = 'Creative date preferences' AND question_stem = 'I''d gladly visit a museum on the weekend.' LIMIT 1), 'Yes');

COMMIT;