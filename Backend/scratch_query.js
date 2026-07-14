const mongoose = require('mongoose');

const mongoUri = "mongodb+srv://harshpandey09112004_db_user:harshpandey09112004_db_user@doormeets.4a1n75n.mongodb.net/civilconnect?appName=Doormeets";

const updateSubcategories = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    // Print all subcategories matching the old category ID
    const oldCatId = new mongoose.Types.ObjectId("6a3a2dbb2ab071d12a56a39c");
    const newCatId = new mongoose.Types.ObjectId("6a55e7dedabee9f033cfe937");

    const oldSubcats = await mongoose.connection.db.collection('subcategories').find({ categoryId: oldCatId }).toArray();
    console.log("Subcategories pointing to old category ID:", oldSubcats.map(s => ({ id: s._id, title: s.title })));

    // Update them to point to the new category ID
    const updateRes = await mongoose.connection.db.collection('subcategories').updateMany(
      { categoryId: oldCatId },
      { $set: { categoryId: newCatId } }
    );
    console.log(`Updated ${updateRes.modifiedCount} subcategories to point to the new standard category ID.`);

    await mongoose.disconnect();
  } catch (err) {
    console.error("Error updating subcategories:", err);
  }
};

updateSubcategories();
