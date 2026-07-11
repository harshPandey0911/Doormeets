const mongoose = require('mongoose');

/**
 * HomeContent Model
 * Manages homepage content: banners, promos, curated services, etc.
 */
const homeContentSchema = new mongoose.Schema({
  // City association - if null, considered default/fallback
  cityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City',
    default: null,
    index: true
  },

  // Banners (main homepage banners)
  banners: [{
    imageUrl: {
      type: String,
      default: ''
    },
    text: {
      type: String,
      default: ''
    },
    targetCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null
    },
    slug: {
      type: String,
      default: ''
    },
    targetServiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      default: null
    },
    scrollToSection: {
      type: String,
      default: ''
    },
    order: {
      type: Number,
      default: 0
    }
  }],

  // Promo Carousel
  promos: [{
    title: {
      type: String,
      required: false,
      default: ''
    },
    subtitle: {
      type: String,
      default: ''
    },
    buttonText: {
      type: String,
      default: 'Explore'
    },
    gradientClass: {
      type: String,
      default: 'from-blue-600 to-blue-800'
    },
    imageUrl: {
      type: String,
      default: ''
    },
    targetCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null
    },
    slug: {
      type: String,
      default: ''
    },
    targetServiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      default: null
    },
    scrollToSection: {
      type: String,
      default: ''
    },
    order: {
      type: Number,
      default: 0
    }
  }],

  // Curated Services
  curated: [{
    title: {
      type: String,
      required: false,
      default: ''
    },
    gifUrl: {
      type: String,
      default: ''
    },
    youtubeUrl: {
      type: String,
      default: ''
    },
    targetCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null
    },
    targetServiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      default: null
    },
    slug: {
      type: String,
      default: ''
    },
    order: {
      type: Number,
      default: 0
    }
  }],

  // New & Noteworthy
  noteworthy: [{
    title: {
      type: String,
      required: false,
      default: ''
    },
    imageUrl: {
      type: String,
      default: ''
    },
    targetCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null
    },
    slug: {
      type: String,
      default: ''
    },
    targetServiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      default: null
    },
    order: {
      type: Number,
      default: 0
    }
  }],

  // Most Booked Services
  booked: [{
    title: {
      type: String,
      required: false,
      default: ''
    },
    rating: {
      type: String,
      default: ''
    },
    reviews: {
      type: String,
      default: ''
    },
    price: {
      type: String,
      default: ''
    },
    originalPrice: {
      type: String,
      default: ''
    },
    discount: {
      type: String,
      default: ''
    },
    imageUrl: {
      type: String,
      default: ''
    },
    targetCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null
    },
    slug: {
      type: String,
      default: ''
    },
    targetServiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      default: null
    },
    order: {
      type: Number,
      default: 0
    }
  }],

  // Category Sections
  categorySections: [{
    title: {
      type: String,
      required: true
    },
    seeAllTargetCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null
    },
    seeAllSlug: {
      type: String,
      default: ''
    },
    seeAllTargetServiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      default: null
    },
    cards: [{
      title: String,
      imageUrl: String,
      badge: String,
      price: String,
      originalPrice: String,
      discount: String,
      rating: String,
      reviews: String,
      targetCategoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null
      },
      slug: {
        type: String,
        default: ''
      },
      targetServiceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
        default: null
      }
    }],
    order: {
      type: Number,
      default: 0
    }
  }],

  // Status
  isActive: {
    type: Boolean,
    default: true
  },

  // Section Visibility
  isBannersVisible: { type: Boolean, default: true },
  isPromosVisible: { type: Boolean, default: true },
  isCuratedVisible: { type: Boolean, default: true },
  isNoteworthyVisible: { type: Boolean, default: true },
  isBookedVisible: { type: Boolean, default: true },
  isCategorySectionsVisible: { type: Boolean, default: true },
  isCategoriesVisible: { type: Boolean, default: true },
  isFeaturedSectionsVisible: { type: Boolean, default: true },
  isUpcomingCategoriesVisible: { type: Boolean, default: true },
  isOrderAgainVisible: { type: Boolean, default: true },
  popularServices: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    default: []
  }],
  isPopularServicesVisible: { type: Boolean, default: true },

  // Featured Sections — Admin-curated brand/category showcase below "Order Again"
  featuredSections: [{
    sectionTitle: {
      type: String,
      default: 'Top Brands'
    },
    type: {
      type: String,
      enum: ['brand', 'category'],
      default: 'brand'
    },
    isVisible: {
      type: Boolean,
      default: true
    },
    order: {
      type: Number,
      default: 0
    },
    items: [{
      refId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
      },
      order: {
        type: Number,
        default: 0
      }
    }]
  }],

  // Trust Section Items
  trustItems: [{
    icon: { type: String, default: '✓' },
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    color: { type: String, default: '#2874F0' }
  }],

  // CTA Banner
  ctaBanner: {
    title: { type: String, default: '' },
    subtitle: { type: String, default: '' },
    buttonText: { type: String, default: 'Book Now' },
    imageUrl: { type: String, default: '' },
    targetCategoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    slug: { type: String, default: '' }
  },

  // How It Works
  howItWorks: {
    title: { type: String, default: 'How it works' },
    steps: [{
      title: { type: String, default: '' },
      description: { type: String, default: '' },
      icon: { type: String, default: '' }
    }]
  },
  isHowItWorksVisible: { type: Boolean, default: true },

  // Section Headers
  sectionHeaders: {
    promoTitle: { type: String, default: '' },
    promoSubtitle: { type: String, default: '' },
    curatedTitle: { type: String, default: '' },
    curatedSubtitle: { type: String, default: '' },
    noteworthyTitle: { type: String, default: '' },
    bookedTitle: { type: String, default: '' },
    sectionsTitle: { type: String, default: '' },
    trustTitle: { type: String, default: '' }
  },

  // Section Order
  sectionOrder: {
    type: [String],
    default: [
      'banners',
      'promos',
      'trustItems',
      'categories',
      'popularServices',
      'upcomingCategories',
      'orderAgain',
      'featuredSections',
      'curated',
      'noteworthy',
      'booked',
      'ctaBanner',
      'howItWorks',
      'categorySections'
    ]
  }
}, {
  timestamps: true
});

// Ensure only one home content document exists per city
homeContentSchema.statics.getHomeContent = async function (cityId = null) {
  let query = { cityId: null };

  if (cityId) {
    query = { cityId };
  }

  let homeContent = await this.findOne(query);

  // If requesting a specific city and no content exists, create it by copying default/empty
  if (!homeContent && cityId) {
    // Ideally we might copy from default here, but for now we create empty/default structure
    // Fetch default to see if we can copy basics? No, start fresh or based on migration.
    // Let's create a new entry for this city.
    homeContent = await this.create({ cityId });
  } else if (!homeContent && !cityId) {
    // Create default if it doesn't exist
    homeContent = await this.create({ cityId: null });
  }

  return homeContent;
};

module.exports = mongoose.model('HomeContent', homeContentSchema);

