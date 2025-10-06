--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9 (63f4182)
-- Dumped by pg_dump version 16.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    slug character varying(100) NOT NULL,
    icon character varying(50),
    color character varying(20),
    post_count integer DEFAULT 0,
    member_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.categories OWNER TO neondb_owner;

--
-- Name: comment_likes; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.comment_likes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    comment_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.comment_likes OWNER TO neondb_owner;

--
-- Name: comments; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    content text NOT NULL,
    author_id character varying NOT NULL,
    post_id uuid NOT NULL,
    parent_id uuid,
    like_count integer DEFAULT 0,
    is_deleted boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.comments OWNER TO neondb_owner;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    type character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    message text,
    is_read boolean DEFAULT false,
    entity_type character varying(50),
    entity_id uuid,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.notifications OWNER TO neondb_owner;

--
-- Name: post_likes; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.post_likes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    post_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.post_likes OWNER TO neondb_owner;

--
-- Name: posts; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title character varying(255) NOT NULL,
    content text NOT NULL,
    author_id character varying NOT NULL,
    category_id uuid NOT NULL,
    is_pinned boolean DEFAULT false,
    is_locked boolean DEFAULT false,
    view_count integer DEFAULT 0,
    like_count integer DEFAULT 0,
    reply_count integer DEFAULT 0,
    last_activity_at timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.posts OWNER TO neondb_owner;

--
-- Name: reports; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    reporter_id character varying NOT NULL,
    entity_type character varying(50) NOT NULL,
    entity_id character varying NOT NULL,
    reason character varying(100) NOT NULL,
    description text,
    status character varying(20) DEFAULT 'pending'::character varying,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.reports OWNER TO neondb_owner;

--
-- Name: sessions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sessions (
    sid character varying NOT NULL,
    sess jsonb NOT NULL,
    expire timestamp without time zone NOT NULL
);


ALTER TABLE public.sessions OWNER TO neondb_owner;

--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id character varying NOT NULL,
    email character varying,
    first_name character varying,
    last_name character varying,
    profile_image_url character varying,
    reputation integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    role character varying(20) DEFAULT 'user'::character varying,
    username character varying(50) NOT NULL,
    password character varying(255) NOT NULL
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.categories (id, name, description, slug, icon, color, post_count, member_count, created_at) FROM stdin;
fec19469-a142-4af9-beb6-fb7e0c9d332d	🏢 Business	Economic opportunities, investment landscape, business registration, entrepreneurship, and financial services in Cameroon	business	🏢	#3b82f6	0	0	2025-09-16 13:02:48.319098
3ebd45cf-4b43-40de-aa80-329b85f2b6b7	🏛️ Government	Government services, public offices, policy updates, civic engagement, and administrative procedures in Cameroon	government	🏛️	#6366f1	1	0	2025-09-16 13:02:48.38298
c338ef6f-f4c0-4f89-8395-e5fea7d754aa	🏥 Health	Healthcare access, medical facilities, wellness services, and health initiatives across Cameroon	health	🏥	#10b981	0	0	2025-09-16 13:02:48.494413
3db6ef41-01fd-47a5-8679-f474b561b64e	👪 Family Tree	Trace your Cameroonian ancestry, family heritage, genealogy research, and connect with your roots	family-tree	👪	#8b5cf6	0	0	2025-09-16 13:02:48.531827
51cd1ff4-ebcd-4405-9ace-401c3a3ae97d	🏖️ Tourism	Discover Cameroon's hidden tourist gems, breathtaking locations, cultural experiences, and travel destinations	tourism	🏖️	#06b6d4	1	0	2025-09-16 13:02:48.420611
88a72129-e8e9-42d4-8fea-5b67f88a62b1	🎤 Celebrity	Profiles of notable Cameroonians in entertainment, music, sports, academia, and various professional fields	celebrity	🎤	#f59e0b	1	0	2025-09-16 13:02:48.457101
dec5c5ee-30ff-452d-9e79-29713a6611cc	🎓 Education	Educational institutions, schools, universities, learning resources, and academic opportunities in Cameroon	education	🎓	#ef4444	1	0	2025-09-16 13:02:48.56911
\.


--
-- Data for Name: comment_likes; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.comment_likes (id, user_id, comment_id, created_at) FROM stdin;
\.


--
-- Data for Name: comments; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.comments (id, content, author_id, post_id, parent_id, like_count, is_deleted, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.notifications (id, user_id, type, title, message, is_read, entity_type, entity_id, created_at) FROM stdin;
\.


--
-- Data for Name: post_likes; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.post_likes (id, user_id, post_id, created_at) FROM stdin;
\.


--
-- Data for Name: posts; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.posts (id, title, content, author_id, category_id, is_pinned, is_locked, view_count, like_count, reply_count, last_activity_at, created_at, updated_at) FROM stdin;
80ca5781-c729-4f0e-814b-03f4a70f313c	Fonka Shang Lawrenec	Lawrence Fonka Shang was a distinguished Cameroonian politician and cultural advocate, best known for his tenure as President of the National Assembly of Cameroon from 1988 until his passing in 1992. An Anglophone from the North West Region, he was a prominent member of the Cameroon People's Democratic Movement (CPDM) and played a pivotal role in the nation's legislative leadership during a transformative period in its political history.\n\nBeyond his political career, Fonka Shang contributed significantly to the preservation of cultural heritage through literature. He co-authored works such as *Nso Marriage Custom: Method of Wife Acquisition* and *Folk Tales of Nso: Revisited*, which explore and document the traditions and folklore of the Nso people in Cameroon.\n\nHis legacy continues through his family, including his daughter, Hilda Kellen Fonka, who was born in 1955 and passed away in 2019.\n\n**Source:** Originally published on camernexus.wordpress.com	aa-group-camernexus	88a72129-e8e9-42d4-8fea-5b67f88a62b1	f	f	0	0	0	2025-09-24 21:11:51.221109	2025-09-24 21:11:51.221109	2025-09-24 21:11:51.221109
40c3dddf-5771-428b-bffd-d532c4fb553d	Discovering Mount Fako: The 28th Tallest Mountain in the World	When we think of the world's tallest mountains, names like Everest and K2 often come to mind. But did you know that **Mount Fako**, also known as **Mount Cameroon**, holds a prestigious spot as the **28th tallest mountain in the world**?\n\n## What is Mount Fako?\n\nMount Fako is an active volcano located in the Southwest Region of Cameroon, West Africa. Standing at approximately **4,040 meters (13,255 feet)**, it is the highest peak in Cameroon and one of the most prominent mountains on the African continent.\n\n## Why is Mount Fako Special?\n\n- **Highest Peak in Sub-Saharan Western and Central Africa:** Mount Fako dominates the landscape and is a symbol of natural beauty and geological significance in the region.\n- **Active Volcano:** Its volcanic activity has shaped the surrounding terrain, creating fertile soils and unique ecosystems.\n- **Cultural Significance:** The mountain holds spiritual importance for local communities and is a popular destination for hikers and adventurers.\n- **Global Ranking:** Ranked as the 28th tallest mountain worldwide, it stands out not just regionally but on the global stage.\n\n## Exploring Mount Fako\n\nFor nature lovers and adventure seekers, climbing Mount Fako offers breathtaking views, diverse flora and fauna, and a chance to experience one of Africa's most iconic natural landmarks. The ascent is challenging but rewarding, with guided tours available for those eager to explore its slopes.\n\n**Source:** Originally published on camernexus.wordpress.com	aa-group-camernexus	51cd1ff4-ebcd-4405-9ace-401c3a3ae97d	f	f	0	0	0	2025-09-24 21:11:58.206492	2025-09-24 21:11:58.206492	2025-09-24 21:11:58.206492
f675a20e-2b3d-4baf-975e-149ff1e1de6e	Professor Teke Ngomba Chumbow: A Visionary Academic Leader	Professor Teke Ngomba Chumbow is a distinguished Cameroonian academic and linguist. His impact on the higher education landscape in Cameroon is both profound and far-reaching. He has served as Rector at several major state universities. These include the University of Dschang and the University of Ngaoundéré. He later returned to Yaoundé. There, he continued to influence educational policies and development.\n\n## Setting Up the ICT University\n\nOne of Professor Chumbow's most significant achievements is his instrumental role in **setting up the ICT University** in Cameroon. He recognized the critical role of technology in modern education and development. He championed the establishment of a university that would bridge the digital divide. This university aims to cutting-edge ICT-focused education tailored to Africa's unique context.\n\n## The ICT University Legacy\n\nThe **ICT University** is headquartered in Yaoundé. It was founded with the vision of producing a new generation of African tech leaders, researchers, and innovators. Under Professor Chumbow's leadership, the university has grown rapidly. It provides accessible, globally competitive education in information and communication technologies. It also offers education in business and engineering fields. It stands as a model of public-private partnership in higher education and continues to attract students from across Africa.\n\n## Vision for the Future\n\nProfessor Chumbow's legacy is not only in the institutions he has led. It is also in the vision he continues to promote. This vision empowers African universities to produce world-class graduates ready to lead in a digital and knowledge-based economy.\n\n**Source:** Originally published on camernexus.wordpress.com	aa-group-camernexus	dec5c5ee-30ff-452d-9e79-29713a6611cc	f	f	0	0	0	2025-09-24 21:12:10.392866	2025-09-24 21:12:10.392866	2025-09-24 21:12:10.392866
78cb79d6-6aed-4cfa-900d-efc0e7e95e95	Port of Douala-Bonabéri Celebrates Historic 150th Anniversary	The Port of Douala-Bonabéri is marking a significant milestone as it celebrates **150 years of operations**, making it one of the oldest and most important maritime infrastructure in Central Africa.\n\n## Prime Minister Leads Commemorations\n\n**Prime Minister Joseph Dion Ngute** is attending and leading the commemorative celebrations, highlighting the strategic importance of this port to Cameroon's economy and the broader Central African region.\n\n## Historical Significance\n\nThe Port of Douala-Bonabéri has served as:\n- **Gateway to Central Africa** - Primary entry point for goods destined for Chad, Central African Republic, and eastern Cameroon\n- **Economic Engine** - Major contributor to Cameroon's GDP and employment\n- **Maritime Heritage** - Witness to 150 years of maritime evolution and technological advancement\n\n## Modern Importance\n\nToday, the port continues to play a crucial role in:\n- Regional trade facilitation\n- Import/export operations for landlocked neighboring countries\n- Supporting Cameroon's economic development\n- Connecting Central Africa to global markets\n\nThis 150th anniversary celebration recognizes not only the port's historical importance but also its ongoing role in shaping the economic future of the region.\n\n**Source:** Recent reports on Port of Douala-Bonabéri commemorations	aa-group-camernexus	3ebd45cf-4b43-40de-aa80-329b85f2b6b7	f	f	0	0	0	2025-09-26 09:09:10.192731	2025-09-26 09:09:10.192731	2025-09-26 09:09:10.192731
\.


--
-- Data for Name: reports; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.reports (id, reporter_id, entity_type, entity_id, reason, description, status, created_at) FROM stdin;
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sessions (sid, sess, expire) FROM stdin;
VC8SYSLyy1PQZl-WfOb8E5-ay8PCT3xN	{"cookie": {"path": "/", "secure": true, "expires": "2025-10-03T11:38:02.457Z", "httpOnly": true, "originalMaxAge": 604800000}, "replit.com": {"code_verifier": "pwihQ5tJEWsZHZtkw2BtVRSGtNNty1C2IbIM7uylhSI"}}	2025-10-03 11:38:03
7twdZIKFEjr7OsLLhNtWL2SeEwY7GmLQ	{"cookie": {"path": "/", "secure": false, "expires": "2025-10-03T12:36:16.094Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": "0fd11572-3f6e-4b63-9ec0-94b08a1d911e"}}	2025-10-03 12:36:17
puw6xl32DC2B8wexllUrEhPG8OutK_Q6	{"cookie": {"path": "/", "secure": false, "expires": "2025-10-03T12:36:25.273Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": "40f9c8d9-6785-4c33-9ae7-0bbd99ac4a0f"}}	2025-10-03 12:36:26
jtKV8_k5x0MNzdMJv33v8wle4TN1MiEu	{"cookie": {"path": "/", "secure": false, "expires": "2025-10-03T12:39:29.688Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": "0fd11572-3f6e-4b63-9ec0-94b08a1d911e"}}	2025-10-03 12:39:30
bWQGFxDnmvsstQObmkOGzVjVjKmlvXuJ	{"cookie": {"path": "/", "secure": false, "expires": "2025-10-03T12:41:53.616Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": "9743c29a-fc26-4597-a101-c43c67ad4cd1"}}	2025-10-03 12:41:54
J-epUXW2XbSmCM39oDgxTeFnS8FNHE7d	{"cookie": {"path": "/", "secure": false, "expires": "2025-10-03T12:36:37.064Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": "0fd11572-3f6e-4b63-9ec0-94b08a1d911e"}}	2025-10-03 12:36:38
7uf41CXQBegVeLXfEfVr5_cpCxbPMLAZ	{"cookie": {"path": "/", "secure": false, "expires": "2025-10-03T12:42:15.219Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": "cfd14024-a09b-4277-8ae0-d2ae5c340cc7"}}	2025-10-03 12:42:16
i7CjKnRa6lms0amxW6woFYASKXIAW1ua	{"cookie": {"path": "/", "secure": true, "expires": "2025-09-22T13:30:58.652Z", "httpOnly": true, "originalMaxAge": 604800000}, "replit.com": {"code_verifier": "xmWdUXJuCfuTpDKOslCVV8T86awpmVL6oxY9IFD78vE"}}	2025-09-29 02:38:00
tb1JGJFSjxO6NqRwOYUZx7_yatz6LzN8	{"cookie": {"path": "/", "secure": true, "expires": "2025-10-03T11:38:04.187Z", "httpOnly": true, "originalMaxAge": 604800000}, "replit.com": {"code_verifier": "dWJapToizb9YJwceLKBMgDX7Nw9MfHKlYzA-RPINHxk"}}	2025-10-03 17:12:51
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, email, first_name, last_name, profile_image_url, reputation, created_at, updated_at, role, username, password) FROM stdin;
user123	testuser@example.com	John	Doe	\N	0	2025-09-12 20:18:04.122289	2025-09-12 20:31:04.373	user	legacy_6fcc8703-b537-4253-83d3-90de144159d5	$2a$12$defaultlegacyhash.for.existing.users
categorytest789	categorytest789@example.com	Category	Tester	\N	0	2025-09-12 20:49:18.326863	2025-09-12 20:49:18.326863	user	legacy_cadde524-ef83-4b21-9f7c-b687b28191be	$2a$12$defaultlegacyhash.for.existing.users
debugtest456	debugtest456@example.com	Debug	Tester	\N	0	2025-09-12 20:56:54.702942	2025-09-12 20:56:54.702942	user	legacy_673b719b-092f-4172-b231-ba6cb99c5713	$2a$12$defaultlegacyhash.for.existing.users
formtest123	formtest123@example.com	Form	Tester	\N	0	2025-09-15 10:58:49.777103	2025-09-15 10:58:49.777103	user	legacy_e361bcf2-90f3-4555-9c07-9900cdd8c98e	$2a$12$defaultlegacyhash.for.existing.users
testuser123	test@example.com	Test	User	\N	0	2025-09-15 11:26:15.838482	2025-09-15 11:26:15.838482	user	legacy_c0d84d9e-2fd0-4111-9f11-60744dd133a4	$2a$12$defaultlegacyhash.for.existing.users
threadtest456	threadtest@example.com	Thread	Tester	\N	0	2025-09-15 11:47:43.553807	2025-09-15 11:47:43.553807	user	legacy_fcd4e551-d489-4784-b63b-5259e296dc80	$2a$12$defaultlegacyhash.for.existing.users
fAFuaX	fAFuaX@example.com	John	Doe	\N	0	2025-09-15 12:19:37.90655	2025-09-15 12:19:37.90655	user	legacy_86d749dd-ee61-4347-917a-eef3e6276350	$2a$12$defaultlegacyhash.for.existing.users
0fd11572-3f6e-4b63-9ec0-94b08a1d911e	admin@allura.com	Admin	User	\N	0	2025-09-26 12:36:15.984963	2025-09-26 12:36:15.984963	admin	admin	73afd8a4b03f1c8cc04ae26f518da3273d94242bc43660c685084a7d6b3d2bb1cb22420bd80766de216886190a909de2161d6a495b65fe05ca02f8ed0567dc59.00cf1e17093116f0a4656c5754e029a1
40f9c8d9-6785-4c33-9ae7-0bbd99ac4a0f	moderator@allura.com	Moderator	User	\N	0	2025-09-26 12:36:25.177873	2025-09-26 12:36:25.177873	moderator	moderator	dc1bc32e300f13b2f3b09d5e887069624e35957abd832299b3921d5cea32c2f5c2b6d7c2b213d80a617917612317025386171260ea9d3a750fe0c405be3907e3.fb66737b67f00c66dd36e524413b50b5
test-user-456	newuser@example.com	New	User	\N	0	2025-09-15 12:27:43.883312	2025-09-15 12:27:43.883312	user	legacy_f5aa94d6-ec8d-4418-8a5d-d2b54ba4ed14	$2a$12$defaultlegacyhash.for.existing.users
test-user-789	finaluser@example.com	Final	User	\N	0	2025-09-15 12:40:55.097561	2025-09-15 12:40:55.097561	user	legacy_80bbeb26-d622-46d6-895a-a28235c66820	$2a$12$defaultlegacyhash.for.existing.users
debug-user-123	debuguser@example.com	Debug	User	\N	0	2025-09-15 12:48:29.399733	2025-09-15 12:48:29.399733	user	legacy_218a13a5-2538-4ed1-8b95-24aa3e00adde	$2a$12$defaultlegacyhash.for.existing.users
working-user-456	workinguser@example.com	Working	User	\N	0	2025-09-15 12:51:16.435274	2025-09-15 12:51:16.435274	user	legacy_4612bb8c-0e9c-46d3-aaaa-3720d3507661	$2a$12$defaultlegacyhash.for.existing.users
notification-test-user	notificationuser@example.com	Notification	User	\N	0	2025-09-15 13:35:17.66879	2025-09-15 13:35:17.66879	user	legacy_958e4ac1-caa8-4e7f-9210-7b9effc26660	$2a$12$defaultlegacyhash.for.existing.users
form-test-user	formtestuser@example.com	Form	User	\N	0	2025-09-15 13:41:38.672572	2025-09-15 13:41:38.672572	user	legacy_19a50a5e-a5d8-4b4c-b531-393ab7eb6348	$2a$12$defaultlegacyhash.for.existing.users
validation-fix-user	validationfixuser@example.com	Validation	User	\N	0	2025-09-15 13:47:57.927077	2025-09-15 13:47:57.927077	user	legacy_97b0db84-3dd9-4c3e-8f87-5649345c86f3	$2a$12$defaultlegacyhash.for.existing.users
final-test-user	finaltestuser@example.com	Final	User	\N	0	2025-09-15 13:53:44.403641	2025-09-15 13:55:49.313	user	legacy_8a6ab50a-6e79-420d-bab3-28fe878db778	$2a$12$defaultlegacyhash.for.existing.users
aa-group-camernexus	aa@camernexus.wordpress.com	AA	Group	\N	100	2025-09-24 21:11:40.326869	2025-09-24 21:11:40.326869	admin	legacy_9e7bdcc6-0c22-4244-80f4-42efabe9dc58	$2a$12$defaultlegacyhash.for.existing.users
\.


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: categories categories_slug_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_slug_unique UNIQUE (slug);


--
-- Name: comment_likes comment_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.comment_likes
    ADD CONSTRAINT comment_likes_pkey PRIMARY KEY (id);


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: post_likes post_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.post_likes
    ADD CONSTRAINT post_likes_pkey PRIMARY KEY (id);


--
-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);


--
-- Name: reports reports_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (sid);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_session_expire" ON public.sessions USING btree (expire);


--
-- Name: users_username_unique; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX users_username_unique ON public.users USING btree (username) WHERE (username IS NOT NULL);


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

