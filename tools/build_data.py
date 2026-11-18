"""Build assets/data.js from the scraped Pillar Construction site (source-site/)."""
import re, html, json, os
S='/tmp/claude-0/site/'
def T(x): return html.unescape(re.sub(r'<[^>]+>|\s+',' ',x)).strip()
def page(n): return open(S+n).read()
projects=json.load(open('source-site/projects.json'))
def pid(path): return os.path.splitext(os.path.basename(path))[0].replace(' ','_')
P=[]
for i,p in enumerate(projects):
    city,_,st=p['location'].rpartition(',')
    city=city.replace('Washignton','Washington').replace('Mclean','McLean')
    P.append(dict(id=i,s=p['service'],n=p['name'],a=p['address'],c=city.strip(),st=st.strip(),o=p['owner'],g=p['contractor'],ar=p['architect'],img=pid(p['image'])))
# services
svc_meta={'drywall':('Drywall','Drywall','bg_services_4'),'rainscreen':('Rainscreen','Rainscreen Systems','bg_services_7'),
 'eifs-stucco':('EIFS','Exterior Finishes / EIFS / Stucco','bg_services'),'restoration':('Restoration','Restoration / General Contracting','bg_services_8'),
 'exterior-panels':('PillarEP','Pillar Exterior Panels','bg_services_9b')}
home_short={'drywall':'Interior partitions, exterior walls, typical walls assemblies and a wide range of specialty finishes and acoustical tile ceilings complete the drywall packages that we provide.',
 'rainscreen':'Advancement in building technologies and the invention of new cladding products bring versatile solutions to the building skin challenge.',
 'eifs-stucco':'With millions of square feet of exterior coatings installed, we have the experience to handle any project ranging from a high-rise application to complete campuses with multiple structures.',
 'restoration':'Bringing back the beauty and proper functionality of an existing structure requires extensive expertise in a variety of building technologies.',
 'exterior-panels':'A factory-fabricated exterior wall assembly comprised of the cold-formed metal-framing, exterior sheathing, and air-vapor barrier (AVB).'}
SV=[]
SCOPES={'drywall':['Metal Framing','Rough Carpentry','Building Insulation','Drywall','Specialty Finishes','Acoustical Panels','Venetian Plaster','Acoustical Ceilings','Specialty Ceilings','Glass Fiber Reinforced Concrete','Glass Fiber Reinforced Gypsum','Doors, Frames, and Hardware'],
 'rainscreen':['Metal Composite Panels','Fiber Cement','Terracotta','Single Skin Rainscreens','Metal Plate','Manufactured Thin Stone','Aluminum Plate Material','High-Pressure Laminate','Insulated Metal Panels','Ultra-High Pressure Concrete','Porcelain Tiles','3-D Scanning'],
 'eifs-stucco':['EIFS','Stucco','Air Barrier','Vapor / Moisture Barrier','Renovation and Repair','Scaffolding','Dryvit Systems','STO Corp. Systems','BASF Wall Systems','Senergy Wall Systems','Parex Systems'],
 'restoration':['New Construction','Renovations / Additions','Tenant Fit-outs','Facade Renovations','Design-Build','Phased / Occupied Renovations'],
 'exterior-panels':['Cold-formed metal framing','Exterior sheathing','Air-vapor barrier (AVB)','Factory-fabricated assembly','Off-site waste handling','Any industry-standard brand']}
for k,(q,title,bg) in svc_meta.items():
    h=page(f'Pillar_Construction_Services_asp_service_{q}.html')
    lead=T(re.search(r'<p class="lead">(.*?)</p>',h,re.S).group(1))
    paras=[T(x) for x in re.findall(r'<p class="content"[^>]*>(.*?)</p>',h,re.S)]
    paras=[x for x in paras if x]
    m=re.search(r'Scopes We Perform:(.*?)</ul>',h,re.S)
    scopes=[T(x) for x in re.findall(r'<li[^>]*>(.*?)</li>',m.group(1),re.S)] if m else []
    gal=[pid(x) for x in re.findall(r"data-open='([^']+)'",page(f'Polaroid_Gallery_asp_service_{q.upper()}.html'))]
    scopes=SCOPES[k]
    if k=='exterior-panels': paras=paras[:2]
    SV.append(dict(id=k,title=title,short=home_short[k],lead=lead,body=paras,scopes=[s for s in scopes if s],hero=bg,gallery=gal))
# awards
h=page('Pillar_Construction_Awards_asp.html')
AW=[];cur=None
for m in re.finditer(r'marker-year">(\d{4})<|<p>(.*?)</p>',h,re.S):
    if m.group(1): cur=dict(y=m.group(1),items=[]);AW.append(cur)
    elif cur is not None:
        inner=m.group(2); sp=re.search(r'<span>(.*?)</span>',inner,re.S)
        t=T(re.sub(r'<span>.*?</span>','',inner,flags=re.S)); d=T(sp.group(1)) if sp else ''
        if t or d: cur['items'].append([t,d])
AW=[a for a in AW if a['items']]
# testimonials
h=page('Pillar_Construction_Testimonials_asp.html')
TS=[];seen=set()
for m in re.finditer(r'<div class="testimonial-content">(.*?)<h3 class="title">(.*?)</h3>\s*<span class="post">(.*?)</span>',h,re.S):
    q=T(re.sub(r'<div class="testimonial-icon">.*?</div>','',m.group(1),flags=re.S)); 
    if q in seen: continue
    seen.add(q); TS.append(dict(q=q,by=T(m.group(2)),role=T(m.group(3))))
# fix live-site attribution error (Wal*Mart quote is Hensel Phelps) and obvious typos
for t in TS:
    if t['q'].startswith('Pillar Construction performed as a true partner'): t['by'],t['role']='Hensel Phelps Construction Co.','Project Manager'
TYPO={'Constrution':'Construction','poject':'project','forwad':'forward','hard word':'hard work','subocntractors':'subcontractors','instrusion':'intrusion','occured':'occurred','requistions':'requisitions','commiment':'commitment','demads':'demands','extend out personal':'extend our personal','been been':'been','helping to making':'helping make'}
for t in TS:
    for a,b in TYPO.items(): t['q']=t['q'].replace(a,b)
    t['role']=t['role'].replace('Cheif','Chief')
# team
h=page('Pillar_Construction_team_asp.html')
TM=[dict(n=T(n),r=T(r),img=os.path.splitext(os.path.basename(i))[0]) for i,n,r in re.findall(r'<img src="(img/team/[^"]+)".*?<div class="name">\s*(.*?)<span class="position">(.*?)</span>',h,re.S)]
# press
h=page('Pillar_Construction_Press_asp.html')
PR=[x for x in [dict(t=T(t),pdf='https://www.pillarconstruction.com/'+a,img=os.path.splitext(os.path.basename(i))[0]) for a,i,t in re.findall(r'<a href="([^"]+)"[^>]*>\s*<img src="img/(?:thumbnail/)?([^"]+)".*?<span>(.*?)</span>',h,re.S)] if 'pdf' in x['pdf'] or 'eifsmart' in x['pdf']]
# affiliations
h=page('Pillar_Construction_Affiliations_asp.html')
AF_names=['Washington Building Congress','Associated Builders and Contractors, Inc.','Associated General Contractors','Air Barrier Association of America','EIFS Industry Members Association','American Subcontractors Association','Association of the Wall and Ceiling Industries']
AF=[dict(img=os.path.splitext(os.path.basename(i))[0],url=u) for i,u in re.findall(r"url\(img/affiliation/([^)]+)\)\" data-goto=\"([^\"]+)\"",h)]
for a,n in zip(AF,AF_names): a['n']=n
D=dict(
 company=dict(name='Pillar Construction',legal='Pillar Construction, Inc.',since='1995',
   hero=['Materialize','Your Idea'],
   heroLines=['Delivering the construction project of your dreams involves synchronizing a multitude of materials perfectly.','Imagination, vision and technical expertise combined with a can-do attitude is Pillar Construction.'],
   tagline='Interior and Exterior Finish Experts Since 1996',
   intro='Our architects, engineers, construction professionals and applicators combined experience qualify us to deliver excellent quality and the opportunity to provide value engineering options to achieve the best results at a competitive price.',
   about=['We are a full-service specialty contractor with offices located in Washington DC, Texas, Florida and New Jersey, and are able to perform work across most of the Mid-Atlantic, the Northeast, and the Southern states.',
          'Founded in 1995, the company has experienced rapid growth by delivering on our promises to our clients. We self-perform a variety of scopes of work including Drywall, Rainscreen, Restoration, EIFS, Stucco, Rough Carpentry, and Vapor / Air Barriers.',
          'Our team of architects, engineers, construction professionals and applicators’ combined experience qualify us to deliver excellent quality. We believe in partnering with our clients throughout the construction process by getting involved in the early design stages, providing value engineering options to achieve the best results at a competitive price, developing a plan to complete the work, and then executing the plan safely.'],
   teamIntro=['Over a century of combined experience solving complex construction challenges with intelligent and cost effective solutions.','Our people are our foundation.  We are a team of creative problem solvers, technical experts, and passionate builders who collaborate to deliver the best experience for our clients and partners. With a diverse focus, each member of our team utilizes a hands on approach applying their unique talents towards each project, from inception, through fruition.'],
   cta=['We are just a click away','An experienced team, your trusted partner.','We would love to work with you on your next project. Our expertise in Drywall, Rainscreen Systems, Exterior Finishes, and Restorations of all kinds makes us a trusted partner.','How Can We Help?'],
   careers=['Join The Pillar Construction Family','We are growing!','Now more than ever we need talented people: people with the passion, curiosity and drive to make things better. Become a part of a powerful network of alumni around the world while enjoying an exceptional work experience that will develop and enrich you.'],
   email='info@PillarConstruction.com',phone='703.941.5891',address='5649-S General Washington Drive, Alexandria, VA 22312'),
 ep=dict(lead='Pillar knows Exterior Panels!',
   stats=[['99','%','of the waste associated with the Pillar EP is handled off-site'],['10','%','reduction in total cost of job-site waste removal'],['2','wks','to a weathertight floor after removal of concrete formwork'],['90','%','of the most dangerous near slab-edge labor hours removed'],['2','mo','project critical path savings, from one month upwards']],
   why=[['Quality','By performing the fabrication and assembly of the exterior wall structure in our off-site facility, we are able to maintain a consistent level of quality that cannot be replicated by stick-building on site.'],
        ['Schedule','Our process allows for (in most cases) a floor to be weathertight within two (2) weeks of the removal of concrete formwork.'],
        ['Price','The installed cost of the Pillar EP is no greater than the installed cost of traditional "stick-built" construction and in many cases can cost significantly less.'],
        ['Better','On-Site, conventional assembly, oftentimes performed from a scaffolding many stories in the air, cannot achieve the consistency and quality that our controlled manufacturing delivers.'],
        ['Faster','Dried-in floor levels in as little as two (2) weeks. Project Critical Path savings from one (1) month to upwards of two (2) months.'],
        ['Safer','Ninety percent (90%) of the most dangerous near slab-edge labor hours are removed and replaced with fabrication facility labor hours.']],
   layers=[['Cold-formed metal framing','Structural backbone, factory-cut and assembled'],['Exterior sheathing','Rigid substrate fastened in controlled conditions'],['Air-vapor barrier (AVB)','Continuous membrane, sealed before it leaves the plant'],['Cladding of your choice','Any of the well known brands in the industry']],
   brochure='https://www.pillarconstruction.com/pdf/Pillar_Exterior_Panel.pdf'),
 offices=[dict(c='Washington, DC',t='Washington DC Headquarters',a=['5649-S General Washington Drive','Alexandria, Virginia 22312'],p='(703) 941-5891',f='(703) 941-5893',lat=38.80,lng=-77.17,map='Location-Washington'),
          dict(c='Houston, TX',t='Houston Office',a=['21315 Inverness Forest Blvd','Houston, TX 77073'],p='(281) 580-4300',f='(281) 580-4310',lat=30.0,lng=-95.4,map='Location-Texas'),
          dict(c='Orlando, FL',t='Florida Office',a=['2727 N John Young Pkwy, Unit B','Orlando, FL 32804'],p='(571) 617-3122',f='(281) 580-4310',lat=28.57,lng=-81.42,map='Location-Florida'),
          dict(c='Morganville, NJ',t='New Jersey Office',a=['1030 Campus Drive West, Suite C','Morganville, New Jersey 07746'],p='(732) 792-6400',f='(281) 580-4310',lat=40.37,lng=-74.24,map='Location-NJ')],
 services=SV,projects=P,awards=AW,testimonials=TS,team=TM,press=PR,affiliations=AF)
os.makedirs('assets',exist_ok=True)
open('assets/data.js','w').write('window.PILLAR='+json.dumps(D,ensure_ascii=False,separators=(',',':'))+';\n')
print('projects',len(P),'services',[(s['id'],len(s['scopes']),len(s['gallery']),len(s['body'])) for s in SV],'awards',len(AW),sum(len(a['items']) for a in AW),'testi',len(TS),'team',len(TM),'press',len(PR),'aff',len(AF))
print(AW[0],TS[0]['by'],PR[:2])
