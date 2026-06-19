const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User');
const LawyerProfile = require('./models/LawyerProfile');
const Comment = require('./models/Comment');
const HiringRequest = require('./models/HiringRequest');
const Transaction = require('./models/Transaction');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://legalease:CyHgKsQaHkMhBMiI@cluster0.pv9fbcf.mongodb.net/legalease?appName=Cluster0';

const seedData = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB Atlas...');

    // Clear existing data
    await User.deleteMany({});
    await LawyerProfile.deleteMany({});
    await Comment.deleteMany({});
    await HiringRequest.deleteMany({});
    await Transaction.deleteMany({});
    console.log('Cleared existing database entries (Users, Profiles, Comments, HiringRequests, Transactions)...');

    const salt = await bcrypt.genSalt(10);
    const defaultPassword = await bcrypt.hash('123456', salt);

    // Create Test Client
    const clientUser = new User({
      name: 'Kazi Client',
      email: 'client@gmail.com',
      password: defaultPassword,
      role: 'user',
      avatar: ''
    });
    await clientUser.save();
    console.log('Test Client created (client@gmail.com / 123456)...');

    // Create Test Admin
    const adminUser = new User({
      name: 'Kazi Admin',
      email: 'admin@gmail.com',
      password: defaultPassword,
      role: 'admin',
      avatar: ''
    });
    await adminUser.save();
    console.log('Test Admin created (admin@gmail.com / 123456)...');

    // Expanded Fallback Lawyers Data (18 lawyers - 3 for each of the 6 specialization categories)
    const lawyersData = [
      // 1. Corporate Law
      {
        name: 'Barrister Rafique-ul Huq',
        email: 'rafique@legalease.com',
        specialization: 'Corporate Law',
        rate: 150,
        ratingAverage: 4.9,
        reviewsCount: 2,
        status: 'Available',
        image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400&h=533',
        badge: 'Gold Partner',
        bio: 'Barrister Rafique-ul Huq was a senior advocate of the Supreme Court of Bangladesh. With over 5 decades of legal experience, he specialized in constitutional law, corporate governance, and complex commercial disputes. He served as the Attorney General of Bangladesh in 1990 and was widely respected for his legal acumen and pro-bono work.',
        dateJoined: new Date('2020-01-15T00:00:00.000Z')
      },
      {
        name: 'Advocate Tanjib-ul Alam',
        email: 'tanjib@legalease.com',
        specialization: 'Corporate Law',
        rate: 180,
        ratingAverage: 4.7,
        reviewsCount: 1,
        status: 'Available',
        image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400&h=533',
        badge: 'Rising Star',
        bio: 'Advocate Tanjib-ul Alam is a leading corporate law attorney specializing in telecommunications regulations, mergers and acquisitions, infrastructure financing, and cross-border investments. He has played key roles in drafting legislative acts in Bangladesh and acts as legal counsel to major tech and telecom conglomerates.',
        dateJoined: new Date('2022-11-01T00:00:00.000Z')
      },
      {
        name: 'Barrister Nihad Kabir',
        email: 'nihad@legalease.com',
        specialization: 'Corporate Law',
        rate: 200,
        ratingAverage: 4.8,
        reviewsCount: 1,
        status: 'Available',
        image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400&h=533',
        badge: 'Senior Counsel',
        bio: 'Barrister Nihad Kabir is an expert in corporate, commercial, and labor law. She is the former president of Metropolitan Chamber of Commerce and Industry (MCCI) and advises top-tier financial institutions and multinational conglomerates.',
        dateJoined: new Date('2021-02-14T00:00:00.000Z')
      },

      // 2. Criminal Defense
      {
        name: 'Zakir A. Khan, LL.M.',
        email: 'zakir@legalease.com',
        specialization: 'Criminal Defense',
        rate: 130,
        ratingAverage: 4.9,
        reviewsCount: 1,
        status: 'Available',
        image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400&h=533',
        badge: 'Trial Expert',
        bio: 'Zakir A. Khan is a veteran criminal defense lawyer with an LL.M. in trial advocacy. He has represented clients in complex white-collar crime investigations, cybercrime charges, and high-profile felony trials. His strategic defense tactics and sharp cross-examination skills have earned him a reputation as an elite trial attorney.',
        dateJoined: new Date('2020-08-14T00:00:00.000Z')
      },
      {
        name: 'Advocate Khurshid Alam',
        email: 'khurshid@legalease.com',
        specialization: 'Criminal Defense',
        rate: 160,
        ratingAverage: 4.8,
        reviewsCount: 1,
        status: 'Busy',
        image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400&h=533',
        badge: 'Highly Rated',
        bio: 'Advocate Khurshid Alam is a seasoned defense attorney specializing in white-collar crimes, financial frauds, and criminal appeals in the High Court Division. He is known for his precise legal arguments and aggressive courtroom presence.',
        dateJoined: new Date('2021-04-10T00:00:00.000Z')
      },
      {
        name: 'Advocate Z.I. Khan Panna',
        email: 'panna@legalease.com',
        specialization: 'Criminal Defense',
        rate: 140,
        ratingAverage: 4.9,
        reviewsCount: 1,
        status: 'Available',
        image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400&h=533',
        badge: 'Veteran Advocate',
        bio: 'Advocate Z.I. Khan Panna has more than 35 years of trial experience defending high-profile criminal cases, human rights abuses, and constitutional appeals. He is a prominent member of the Bangladesh Bar Council.',
        dateJoined: new Date('2019-12-05T00:00:00.000Z')
      },

      // 3. Family Law
      {
        name: 'Advocate Rokeya Rahman',
        email: 'rokeya@legalease.com',
        specialization: 'Family Law',
        rate: 120,
        ratingAverage: 4.8,
        reviewsCount: 1,
        status: 'Busy',
        image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400&h=533',
        badge: 'Highly Rated',
        bio: 'Advocate Rokeya Rahman is a dedicated family law practitioner specializing in divorce proceedings, child custody disputes, estate planning, and mediation. Over her 15-year career, she has helped hundreds of clients navigate emotional legal battles with dignity, empathy, and professional integrity.',
        dateJoined: new Date('2021-03-22T00:00:00.000Z')
      },
      {
        name: 'Advocate Syeda Rizwana Hasan',
        email: 'rizwana@legalease.com',
        specialization: 'Family Law',
        rate: 150,
        ratingAverage: 4.9,
        reviewsCount: 1,
        status: 'Available',
        image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400&h=533',
        badge: 'Mediation Expert',
        bio: 'Advocate Syeda Rizwana Hasan specializes in family dispute resolution, domestic violence support, partition suites, and inheritance disputes. She brings empathy and strong mediation skills to resolve complex familial legal matters.',
        dateJoined: new Date('2020-05-18T00:00:00.000Z')
      },
      {
        name: 'Advocate Salma Ali',
        email: 'salma@legalease.com',
        specialization: 'Family Law',
        rate: 110,
        ratingAverage: 4.7,
        reviewsCount: 1,
        status: 'Available',
        image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400&h=533',
        badge: 'Pro Bono Champion',
        bio: 'Advocate Salma Ali is a human rights advocate and family lawyer. She has decades of experience representing women and children in child custody, marriage dissolution, and maintenance litigation, and has led national legal aid organizations.',
        dateJoined: new Date('2021-06-25T00:00:00.000Z')
      },

      // 4. Intellectual Property
      {
        name: 'Dr. Towhidul Islam',
        email: 'towhid@legalease.com',
        specialization: 'Intellectual Property',
        rate: 170,
        ratingAverage: 4.9,
        reviewsCount: 1,
        status: 'Available',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400&h=533',
        badge: 'IP Specialist',
        bio: 'Dr. Towhidul Islam is an academic and practicing consultant specializing in Trademark, Patent, and Copyright laws. He holds a PhD in Intellectual Property Law and works closely with tech startups and creative industries to protect their IP portfolios.',
        dateJoined: new Date('2019-06-10T00:00:00.000Z')
      },
      {
        name: 'Advocate Rezwanul Haque',
        email: 'rezwan@legalease.com',
        specialization: 'Intellectual Property',
        rate: 130,
        ratingAverage: 4.6,
        reviewsCount: 1,
        status: 'Available',
        image: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=400&h=533',
        badge: 'Tech-Savvy Atty',
        bio: 'Advocate Rezwanul Haque is a dynamic IP practitioner who handles trademark registrations, patent filings, domain name disputes, and copyright infringements in digital media. He represents software companies and entertainment groups.',
        dateJoined: new Date('2022-04-18T00:00:00.000Z')
      },
      {
        name: 'Advocate Shamim Ara',
        email: 'shamim@legalease.com',
        specialization: 'Intellectual Property',
        rate: 140,
        ratingAverage: 4.8,
        reviewsCount: 1,
        status: 'Busy',
        image: 'https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&q=80&w=400&h=533',
        badge: 'Copyright Guru',
        bio: 'Advocate Shamim Ara focuses on international copyright treaties, patent licensing negotiations, and software IP protection. She advises biotech firms and academic institutions on commercializing patents and managing IP risks.',
        dateJoined: new Date('2021-09-09T00:00:00.000Z')
      },

      // 5. Civil Litigation
      {
        name: 'Advocate Manzill Murshid',
        email: 'manzill@legalease.com',
        specialization: 'Civil Litigation',
        rate: 160,
        ratingAverage: 4.9,
        reviewsCount: 1,
        status: 'Available',
        image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=400&h=533',
        badge: 'PIL Advocate',
        bio: 'Advocate Manzill Murshid is a prominent Supreme Court lawyer specializing in civil disputes, property litigation, and Public Interest Litigation (PIL). He has won numerous landmark civil rights and environmental cases in Bangladesh.',
        dateJoined: new Date('2020-05-14T00:00:00.000Z')
      },
      {
        name: 'Advocate Jyotirmoy Barua',
        email: 'jyotirmoy@legalease.com',
        specialization: 'Civil Litigation',
        rate: 140,
        ratingAverage: 4.7,
        reviewsCount: 1,
        status: 'Available',
        image: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=400&h=533',
        badge: 'Rights Defender',
        bio: 'Advocate Jyotirmoy Barua is a leading civil litigation lawyer handling property disputes, breach of contract claims, civil revisions, and constitutional writs. He represents corporate clients as well as marginalized individuals.',
        dateJoined: new Date('2021-11-20T00:00:00.000Z')
      },
      {
        name: 'Advocate Shahdeen Malik',
        email: 'shahdeen@legalease.com',
        specialization: 'Civil Litigation',
        rate: 180,
        ratingAverage: 4.9,
        reviewsCount: 1,
        status: 'Available',
        image: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&q=80&w=400&h=533',
        badge: 'Constitutional Expert',
        bio: 'Dr. Shahdeen Malik is a veteran lawyer, legal commentator, and civil litigator. He specializes in civil writs, contract laws, and service matters. He holds degrees from universities in the US and Russia, bringing a global perspective.',
        dateJoined: new Date('2019-10-15T00:00:00.000Z')
      },

      // 6. Tax Consultancy
      {
        name: 'Advocate Masud Khan',
        email: 'masud@legalease.com',
        specialization: 'Tax Consultancy',
        rate: 130,
        ratingAverage: 4.8,
        reviewsCount: 1,
        status: 'Available',
        image: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&q=80&w=400&h=533',
        badge: 'Tax Advisor',
        bio: 'Advocate Masud Khan is a corporate tax advisor helping clients with VAT compliance, customs duties, income tax assessments, and tax appeals. He has over 15 years of experience advising manufacturing and export industries.',
        dateJoined: new Date('2020-03-12T00:00:00.000Z')
      },
      {
        name: 'Advocate Farzana Begum',
        email: 'farzana@legalease.com',
        specialization: 'Tax Consultancy',
        rate: 120,
        ratingAverage: 4.7,
        reviewsCount: 1,
        status: 'Available',
        image: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=400&h=533',
        badge: 'Audit Consultant',
        bio: 'Advocate Farzana Begum represents individuals and corporations in transfer pricing cases, corporate tax structures, and tax tribunals. She is a double degree holder in finance and law, offering holistic business advisory.',
        dateJoined: new Date('2021-08-01T00:00:00.000Z')
      },
      {
        name: 'Advocate M. A. Halim',
        email: 'halim@legalease.com',
        specialization: 'Tax Consultancy',
        rate: 150,
        ratingAverage: 4.9,
        reviewsCount: 1,
        status: 'Busy',
        image: 'https://images.unsplash.com/photo-1489980508314-941910ded1f4?auto=format&fit=crop&q=80&w=400&h=533',
        badge: 'VAT Specialist',
        bio: 'Advocate M. A. Halim specializes in tax disputes, corporate auditing, VAT, and wealth statements. He is also a writer of popular legal textbooks and guides on tax laws in Bangladesh.',
        dateJoined: new Date('2020-09-17T00:00:00.000Z')
      }
    ];

    const commentsMap = {
      'rafique@legalease.com': [
        { clientName: 'Rahim Uddin', rating: 5, text: 'Exceptional legal guidance on our corporate restructuring. Highly professional and knowledgeable.' },
        { clientName: 'Kamil Ahmed', rating: 5, text: 'Truly a legend of constitutional law. Grateful for his advice on our non-profit foundation matters.' }
      ],
      'tanjib@legalease.com': [
        { clientName: 'Sajid Islam', rating: 5, text: 'Best telecom legal consultant in the country. Helped us with our licensing approval process.' }
      ],
      'nihad@legalease.com': [
        { clientName: 'Rezaul Karim', rating: 5, text: 'Superb legal compliance advice for our new startup. Extremely knowledgeable about corporate rules.' }
      ],
      'zakir@legalease.com': [
        { clientName: 'Mamunur Rashid', rating: 5, text: 'Outstanding criminal defense representation. Dismissed all baseless allegations. Highly recommend.' }
      ],
      'khurshid@legalease.com': [
        { clientName: 'Nasir Uddin', rating: 5, text: 'Very tactical criminal defense lawyer. Managed our bail hearing excellently.' }
      ],
      'panna@legalease.com': [
        { clientName: 'Tariq Anam', rating: 5, text: 'Highly experienced and courageous. Understood our criminal case instantly.' }
      ],
      'rokeya@legalease.com': [
        { clientName: 'Tania Sultana', rating: 5, text: 'Helped me win custody of my children. Very empathetic and dedicated.' }
      ],
      'rizwana@legalease.com': [
        { clientName: 'Laila Begum', rating: 5, text: 'Excellent mediation during our property partition dispute. Highly professional.' }
      ],
      'salma@legalease.com': [
        { clientName: 'Shaila Sharmin', rating: 5, text: 'Compassionate representation during my difficult divorce case. Very grateful for her support.' }
      ],
      'towhid@legalease.com': [
        { clientName: 'Enamul Haque', rating: 5, text: 'Dr. Towhidul guided our tech startup through complex patent registration. Brilliant IP mind.' }
      ],
      'rezwan@legalease.com': [
        { clientName: 'Asif Rahman', rating: 5, text: 'Resolved our brand trademark infringement dispute within weeks. Super fast response!' }
      ],
      'shamim@legalease.com': [
        { clientName: 'Mitu Chowdhury', rating: 5, text: 'Amazing consulting on copyright licensing for our media publication. Highly recommend.' }
      ],
      'manzill@legalease.com': [
        { clientName: 'Imran H. Khan', rating: 5, text: 'A stellar advocate for civil rights. Extremely successful litigation.' }
      ],
      'jyotirmoy@legalease.com': [
        { clientName: 'Shahidul Islam', rating: 5, text: 'A very dedicated civil lawyer. Helped us recover our ancestral land.' }
      ],
      'shahdeen@legalease.com': [
        { clientName: 'Riaz Ahmed', rating: 5, text: 'Dr. Shahdeen Malik has exceptional depth in civil matters and contract disputes. Very reassuring.' }
      ],
      'masud@legalease.com': [
        { clientName: 'Farhad Hossain', rating: 5, text: 'Outstanding tax consulting. Saved our company from double taxation issues.' }
      ],
      'farzana@legalease.com': [
        { clientName: 'Kanak Chowdhury', rating: 5, text: 'Very precise auditing and tax report preparation. Highly professional service.' }
      ],
      'halim@legalease.com': [
        { clientName: 'Zamil Hossain', rating: 5, text: 'He has unmatched knowledge on VAT and income tax laws. Very reliable tax consultant.' }
      ]
    };

    for (const lawData of lawyersData) {
      // Create user
      const user = new User({
        name: lawData.name,
        email: lawData.email,
        password: defaultPassword,
        role: 'lawyer',
        avatar: ''
      });
      await user.save();
      console.log(`User created for ${lawData.name} (${lawData.email})...`);

      // Create profile
      const profile = new LawyerProfile({
        user: user._id,
        bio: lawData.bio,
        specialization: lawData.specialization,
        rate: lawData.rate,
        status: lawData.status,
        badge: lawData.badge,
        image: lawData.image,
        reviewsCount: lawData.reviewsCount,
        ratingAverage: lawData.ratingAverage,
        isVerified: true,
        isPublished: true,
        dateJoined: lawData.dateJoined
      });
      await profile.save();
      console.log(`LawyerProfile created for ${lawData.name}...`);

      // Add reviews
      const reviews = commentsMap[lawData.email] || [];
      for (const rev of reviews) {
        // Create a dummy client user for review
        const dummyClient = new User({
          name: rev.clientName,
          email: `${rev.clientName.toLowerCase().replace(' ', '')}@example.com`,
          password: defaultPassword,
          role: 'user',
          avatar: ''
        });
        await dummyClient.save();

        const comment = new Comment({
          client: dummyClient._id,
          lawyer: profile._id,
          rating: rev.rating,
          text: rev.text,
          dateCreated: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
        });
        await comment.save();
      }
      console.log(`Reviews created for ${lawData.name}...`);
    }

    console.log('Database Seeding Completed Successfully! 🎉');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding data:', err);
    process.exit(1);
  }
};

seedData();

