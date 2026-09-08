-- Seed initial standard skills taxonomy for DevPair
-- Minimal set of common college project & hackathon skills across key technical domains

INSERT INTO public.skills (name, category)
SELECT 'React', 'frontend'
WHERE NOT EXISTS (SELECT 1 FROM public.skills WHERE lower(trim(name)) = 'react');

INSERT INTO public.skills (name, category)
SELECT 'Next.js', 'frontend'
WHERE NOT EXISTS (SELECT 1 FROM public.skills WHERE lower(trim(name)) = 'next.js');

INSERT INTO public.skills (name, category)
SELECT 'TypeScript', 'frontend'
WHERE NOT EXISTS (SELECT 1 FROM public.skills WHERE lower(trim(name)) = 'typescript');

INSERT INTO public.skills (name, category)
SELECT 'Tailwind CSS', 'frontend'
WHERE NOT EXISTS (SELECT 1 FROM public.skills WHERE lower(trim(name)) = 'tailwind css');

INSERT INTO public.skills (name, category)
SELECT 'Vue.js', 'frontend'
WHERE NOT EXISTS (SELECT 1 FROM public.skills WHERE lower(trim(name)) = 'vue.js');

INSERT INTO public.skills (name, category)
SELECT 'Node.js', 'backend'
WHERE NOT EXISTS (SELECT 1 FROM public.skills WHERE lower(trim(name)) = 'node.js');

INSERT INTO public.skills (name, category)
SELECT 'Python', 'backend'
WHERE NOT EXISTS (SELECT 1 FROM public.skills WHERE lower(trim(name)) = 'python');

INSERT INTO public.skills (name, category)
SELECT 'FastAPI', 'backend'
WHERE NOT EXISTS (SELECT 1 FROM public.skills WHERE lower(trim(name)) = 'fastapi');

INSERT INTO public.skills (name, category)
SELECT 'PostgreSQL', 'backend'
WHERE NOT EXISTS (SELECT 1 FROM public.skills WHERE lower(trim(name)) = 'postgresql');

INSERT INTO public.skills (name, category)
SELECT 'Go', 'backend'
WHERE NOT EXISTS (SELECT 1 FROM public.skills WHERE lower(trim(name)) = 'go');

INSERT INTO public.skills (name, category)
SELECT 'Java', 'backend'
WHERE NOT EXISTS (SELECT 1 FROM public.skills WHERE lower(trim(name)) = 'java');

INSERT INTO public.skills (name, category)
SELECT 'GraphQL', 'fullstack'
WHERE NOT EXISTS (SELECT 1 FROM public.skills WHERE lower(trim(name)) = 'graphql');

INSERT INTO public.skills (name, category)
SELECT 'Flutter', 'mobile'
WHERE NOT EXISTS (SELECT 1 FROM public.skills WHERE lower(trim(name)) = 'flutter');

INSERT INTO public.skills (name, category)
SELECT 'React Native', 'mobile'
WHERE NOT EXISTS (SELECT 1 FROM public.skills WHERE lower(trim(name)) = 'react native');

INSERT INTO public.skills (name, category)
SELECT 'Swift', 'mobile'
WHERE NOT EXISTS (SELECT 1 FROM public.skills WHERE lower(trim(name)) = 'swift');

INSERT INTO public.skills (name, category)
SELECT 'Kotlin', 'mobile'
WHERE NOT EXISTS (SELECT 1 FROM public.skills WHERE lower(trim(name)) = 'kotlin');

INSERT INTO public.skills (name, category)
SELECT 'PyTorch', 'ai_ml'
WHERE NOT EXISTS (SELECT 1 FROM public.skills WHERE lower(trim(name)) = 'pytorch');

INSERT INTO public.skills (name, category)
SELECT 'TensorFlow', 'ai_ml'
WHERE NOT EXISTS (SELECT 1 FROM public.skills WHERE lower(trim(name)) = 'tensorflow');

INSERT INTO public.skills (name, category)
SELECT 'Machine Learning', 'ai_ml'
WHERE NOT EXISTS (SELECT 1 FROM public.skills WHERE lower(trim(name)) = 'machine learning');

INSERT INTO public.skills (name, category)
SELECT 'Natural Language Processing', 'ai_ml'
WHERE NOT EXISTS (SELECT 1 FROM public.skills WHERE lower(trim(name)) = 'natural language processing');

INSERT INTO public.skills (name, category)
SELECT 'Docker', 'devops_cloud'
WHERE NOT EXISTS (SELECT 1 FROM public.skills WHERE lower(trim(name)) = 'docker');

INSERT INTO public.skills (name, category)
SELECT 'AWS', 'devops_cloud'
WHERE NOT EXISTS (SELECT 1 FROM public.skills WHERE lower(trim(name)) = 'aws');

INSERT INTO public.skills (name, category)
SELECT 'Figma', 'ui_ux_design'
WHERE NOT EXISTS (SELECT 1 FROM public.skills WHERE lower(trim(name)) = 'figma');

INSERT INTO public.skills (name, category)
SELECT 'UI/UX Prototyping', 'ui_ux_design'
WHERE NOT EXISTS (SELECT 1 FROM public.skills WHERE lower(trim(name)) = 'ui/ux prototyping');
