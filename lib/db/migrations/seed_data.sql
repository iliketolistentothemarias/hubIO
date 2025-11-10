-- Seed Data for HubIO
-- Run this after creating all tables
-- Note: User IDs should be replaced with actual auth.users IDs when users are created

-- Insert sample posts (using placeholder user IDs - replace with actual user IDs)
-- These will be inserted only if posts table is empty or for demo purposes
INSERT INTO public.posts (id, author, author_id, title, content, category, likes, tags, pinned, status, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'Sarah Johnson',
  COALESCE((SELECT id FROM public.users WHERE email = 'sarah.johnson@example.com' LIMIT 1), '00000000-0000-0000-0000-000000000001'::uuid),
  'Great experience at the Community Food Bank!',
  'Just finished volunteering at the Greater Pittsburgh Community Food Bank. Amazing organization doing incredible work for our community. Highly recommend getting involved!',
  'Volunteer',
  24,
  ARRAY['volunteer', 'food bank', 'community'],
  false,
  'active',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '2 days'
WHERE NOT EXISTS (SELECT 1 FROM public.posts LIMIT 1);

INSERT INTO public.posts (id, author, author_id, title, content, category, likes, tags, pinned, status, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'Mike Chen',
  COALESCE((SELECT id FROM public.users WHERE email = 'mike.chen@example.com' LIMIT 1), '00000000-0000-0000-0000-000000000002'::uuid),
  'Looking for housing assistance resources',
  'Does anyone know of good housing assistance programs in the Pittsburgh area? Looking for rental assistance and housing counseling services.',
  'Help',
  12,
  ARRAY['housing', 'assistance', 'help'],
  false,
  'active',
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day'
WHERE NOT EXISTS (SELECT 1 FROM public.posts WHERE title = 'Looking for housing assistance resources');

INSERT INTO public.posts (id, author, author_id, title, content, category, likes, tags, pinned, status, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'Emma Williams',
  COALESCE((SELECT id FROM public.users WHERE email = 'emma.williams@example.com' LIMIT 1), '00000000-0000-0000-0000-000000000003'::uuid),
  'Upcoming Community Health Fair - March 15th',
  'Excited to announce the South Fayette Community Health Fair! Free health screenings, flu shots, and wellness information. All ages welcome. See you there!',
  'Events',
  45,
  ARRAY['health', 'event', 'community'],
  true,
  'active',
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '3 days'
WHERE NOT EXISTS (SELECT 1 FROM public.posts WHERE title = 'Upcoming Community Health Fair - March 15th');

INSERT INTO public.posts (id, author, author_id, title, content, category, likes, tags, pinned, status, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'David Brown',
  COALESCE((SELECT id FROM public.users WHERE email = 'david.brown@example.com' LIMIT 1), '00000000-0000-0000-0000-000000000004'::uuid),
  'New Youth Mentorship Program Launching',
  'We''re launching a new youth mentorship program in partnership with Boys & Girls Clubs. Looking for mentors ages 21+ who can commit 2 hours/week. Training provided!',
  'Announcements',
  38,
  ARRAY['youth', 'mentorship', 'volunteer'],
  false,
  'active',
  NOW() - INTERVAL '4 days',
  NOW() - INTERVAL '4 days'
WHERE NOT EXISTS (SELECT 1 FROM public.posts WHERE title = 'New Youth Mentorship Program Launching');

INSERT INTO public.posts (id, author, author_id, title, content, category, likes, tags, pinned, status, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'Lisa Anderson',
  COALESCE((SELECT id FROM public.users WHERE email = 'lisa.anderson@example.com' LIMIT 1), '00000000-0000-0000-0000-000000000005'::uuid),
  'Community Garden Spring Planting Day',
  'Join us this Saturday for our spring planting day at the community garden! Tools and seeds provided. Great for families. No experience necessary.',
  'Community',
  19,
  ARRAY['gardening', 'community', 'volunteer'],
  false,
  'active',
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '5 days'
WHERE NOT EXISTS (SELECT 1 FROM public.posts WHERE title = 'Community Garden Spring Planting Day');

-- Insert sample comments
INSERT INTO public.comments (id, post_id, author, author_id, content, likes, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM public.posts WHERE title = 'Great experience at the Community Food Bank!' LIMIT 1),
  'Mike Chen',
  COALESCE((SELECT id FROM public.users WHERE email = 'mike.chen@example.com' LIMIT 1), '00000000-0000-0000-0000-000000000002'::uuid),
  'That''s awesome! I''ve been thinking about volunteering there. How do I get started?',
  5,
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day'
WHERE EXISTS (SELECT 1 FROM public.posts WHERE title = 'Great experience at the Community Food Bank!')
  AND NOT EXISTS (SELECT 1 FROM public.comments WHERE content = 'That''s awesome! I''ve been thinking about volunteering there. How do I get started?');

INSERT INTO public.comments (id, post_id, author, author_id, content, likes, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM public.posts WHERE title = 'Great experience at the Community Food Bank!' LIMIT 1),
  'Emma Williams',
  COALESCE((SELECT id FROM public.users WHERE email = 'emma.williams@example.com' LIMIT 1), '00000000-0000-0000-0000-000000000003'::uuid),
  'I volunteer there regularly! Great organization. You can sign up through HubIO or contact them directly.',
  8,
  NOW() - INTERVAL '20 hours',
  NOW() - INTERVAL '20 hours'
WHERE EXISTS (SELECT 1 FROM public.posts WHERE title = 'Great experience at the Community Food Bank!')
  AND NOT EXISTS (SELECT 1 FROM public.comments WHERE content = 'I volunteer there regularly! Great organization. You can sign up through HubIO or contact them directly.');

INSERT INTO public.comments (id, post_id, author, author_id, content, likes, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM public.posts WHERE title = 'Looking for housing assistance resources' LIMIT 1),
  'David Brown',
  COALESCE((SELECT id FROM public.users WHERE email = 'david.brown@example.com' LIMIT 1), '00000000-0000-0000-0000-000000000004'::uuid),
  'Check out Allegheny County Housing Authority. They have excellent rental assistance programs and housing counseling. Their office is on Stanwix Street.',
  12,
  NOW() - INTERVAL '18 hours',
  NOW() - INTERVAL '18 hours'
WHERE EXISTS (SELECT 1 FROM public.posts WHERE title = 'Looking for housing assistance resources')
  AND NOT EXISTS (SELECT 1 FROM public.comments WHERE content LIKE 'Check out Allegheny County Housing Authority%');

-- Insert sample volunteer opportunities (expanded list)
INSERT INTO public.volunteer_opportunities (title, description, organization, organization_id, category, location, skills_required, time_commitment, status) VALUES
('Food Bank Distribution Assistant', 'Help distribute food to families in need. Tasks include setup, distribution, and cleanup.', 'Greater Pittsburgh Community Food Bank', 'org-1', 'Food Assistance', '{"lat": 40.3706, "lng": -79.8500, "address": "1 N. Linden Street", "city": "Duquesne", "state": "PA", "zipCode": "15110"}', ARRAY['Customer Service', 'Physical Activity', 'Organization'], '6 hours', 'active'),
('Community Garden Volunteer', 'Help maintain community gardens, assist with planting, weeding, and harvesting.', 'Grow Pittsburgh', 'org-2', 'Environment', '{"lat": 40.4600, "lng": -79.9200, "address": "6587 Hamilton Avenue", "city": "Pittsburgh", "state": "PA", "zipCode": "15206"}', ARRAY['Gardening', 'Physical Activity'], '3 hours', 'active'),
('Youth Mentor', 'Mentor youth ages 10-18 in academic and life skills. Training provided.', 'Boys & Girls Clubs of Western Pennsylvania', 'org-3', 'Youth Services', '{"lat": 40.4442, "lng": -79.9500, "address": "201 N. Bellefield Avenue", "city": "Pittsburgh", "state": "PA", "zipCode": "15213"}', ARRAY['Mentoring', 'Education', 'Communication'], '2 hours/week', 'active'),
('Senior Technology Tutor', 'Help seniors learn to use smartphones, tablets, and computers.', 'Area Agency on Aging', 'org-4', 'Senior Services', '{"lat": 40.3639, "lng": -79.9000, "address": "2900 Lebanon Church Road", "city": "West Mifflin", "state": "PA", "zipCode": "15122"}', ARRAY['Technology', 'Patience', 'Teaching'], '2 hours', 'active'),
('Park Cleanup Volunteer', 'Help clean up local parks and green spaces. Gloves and bags provided.', 'Pittsburgh Parks Conservancy', 'org-5', 'Environment', '{"lat": 40.4406, "lng": -79.9961, "address": "1981 Beechwood Boulevard", "city": "Pittsburgh", "state": "PA", "zipCode": "15217"}', ARRAY['Physical Activity', 'Teamwork'], '3 hours', 'active')
ON CONFLICT DO NOTHING;

-- Insert sample events (expanded list with realistic Pittsburgh/South Fayette events)
INSERT INTO public.events (name, description, category, date, time, location, organizer, organizer_id, capacity, registered, rsvp_required, tags, status) VALUES
('South Fayette Community Health Fair', 'Free health screenings, flu shots, and wellness information for all ages.', 'Health & Wellness', CURRENT_DATE + INTERVAL '15 days', '10:00 AM - 3:00 PM', '{"lat": 40.3800, "lng": -80.1800, "address": "515 Millers Run Road", "city": "South Fayette", "state": "PA", "zipCode": "15017"}', 'South Fayette Township', 'org-1', 500, 234, false, ARRAY['Health', 'Wellness', 'Community', 'Free'], 'upcoming'),
('Pittsburgh Food Bank Volunteer Day', 'Join us for a day of volunteering at the food bank. Help sort donations, pack food boxes, and make a difference.', 'Volunteering', CURRENT_DATE + INTERVAL '20 days', '9:00 AM - 12:00 PM', '{"lat": 40.4406, "lng": -79.9961, "address": "Multiple Locations", "city": "Pittsburgh", "state": "PA", "zipCode": "15219"}', 'Greater Pittsburgh Community Food Bank', 'org-2', 50, 32, true, ARRAY['Volunteering', 'Food', 'Community Service'], 'upcoming'),
('Career Fair - Pittsburgh Convention Center', 'Meet with local employers, explore job opportunities, and get career advice.', 'Employment', CURRENT_DATE + INTERVAL '25 days', '11:00 AM - 4:00 PM', '{"lat": 40.4406, "lng": -79.9961, "address": "1000 Fort Duquesne Boulevard", "city": "Pittsburgh", "state": "PA", "zipCode": "15222"}', 'CareerLink Pittsburgh', 'org-3', 1000, 567, false, ARRAY['Employment', 'Career', 'Networking', 'Jobs'], 'upcoming'),
('Community Garden Spring Planting', 'Help prepare and plant the community garden for spring. All skill levels welcome.', 'Environment', CURRENT_DATE + INTERVAL '35 days', '9:00 AM - 1:00 PM', '{"lat": 40.4600, "lng": -79.9200, "address": "6587 Hamilton Avenue", "city": "Pittsburgh", "state": "PA", "zipCode": "15206"}', 'Grow Pittsburgh', 'org-4', 40, 28, true, ARRAY['Gardening', 'Environment', 'Community', 'Volunteering'], 'upcoming'),
('Youth Mentorship Program Launch', 'Information session for the new youth mentorship program. Learn how to become a mentor or find a mentor.', 'Youth Services', CURRENT_DATE + INTERVAL '40 days', '6:00 PM - 8:00 PM', '{"lat": 40.4442, "lng": -79.9500, "address": "201 N. Bellefield Avenue", "city": "Pittsburgh", "state": "PA", "zipCode": "15213"}', 'Boys & Girls Clubs of Western Pennsylvania', 'org-5', 100, 67, true, ARRAY['Youth', 'Mentorship', 'Education', 'Community'], 'upcoming')
ON CONFLICT DO NOTHING;

-- Insert sample fundraising campaigns (expanded list)
INSERT INTO public.fundraising_campaigns (title, description, category, goal, raised, donors, organizer, organizer_id, location, deadline, status, tags) VALUES
('Community Food Bank Expansion', 'Help us expand our food bank to serve 500+ more families monthly.', 'Food Security', 50000.00, 32500.00, 234, 'Greater Pittsburgh Community Food Bank', 'org-1', '{"lat": 40.3706, "lng": -79.8500, "address": "1 N. Linden Street", "city": "Duquesne", "state": "PA", "zipCode": "15110"}', CURRENT_DATE + INTERVAL '60 days', 'active', ARRAY['Food', 'Community', 'Hunger Relief']),
('Youth Center Renovation', 'Renovate our community youth center with new equipment, study spaces, and recreational facilities.', 'Youth Services', 75000.00, 45600.00, 312, 'Boys & Girls Clubs of Western Pennsylvania', 'org-3', '{"lat": 40.4442, "lng": -79.9500, "address": "201 N. Bellefield Avenue", "city": "Pittsburgh", "state": "PA", "zipCode": "15213"}', CURRENT_DATE + INTERVAL '70 days', 'active', ARRAY['Youth', 'Renovation', 'Community']),
('Housing Assistance Fund', 'Emergency housing assistance fund to help families facing eviction or homelessness.', 'Housing', 100000.00, 67800.00, 445, 'Allegheny County Housing Authority', 'org-8', '{"lat": 40.4406, "lng": -80.0000, "address": "625 Stanwix Street", "city": "Pittsburgh", "state": "PA", "zipCode": "15222"}', CURRENT_DATE + INTERVAL '90 days', 'active', ARRAY['Housing', 'Emergency', 'Support']),
('Mental Health Crisis Support', 'Fund 24/7 crisis support services and expand mobile crisis team.', 'Health Services', 60000.00, 38900.00, 267, 'Resolve Crisis Services', 'org-7', '{"lat": 40.4500, "lng": -79.9000, "address": "333 North Braddock Avenue", "city": "Pittsburgh", "state": "PA", "zipCode": "15208"}', CURRENT_DATE + INTERVAL '120 days', 'active', ARRAY['Mental Health', 'Crisis', 'Support']),
('Community Garden Expansion', 'Expand community gardens to provide more fresh produce to families.', 'Environment', 20000.00, 12300.00, 98, 'Grow Pittsburgh', 'org-6', '{"lat": 40.4600, "lng": -79.9200, "address": "6587 Hamilton Avenue", "city": "Pittsburgh", "state": "PA", "zipCode": "15206"}', CURRENT_DATE + INTERVAL '50 days', 'active', ARRAY['Gardening', 'Food Security', 'Environment'])
ON CONFLICT DO NOTHING;

