const fs = require('fs');
let code = fs.readFileSync('server/db.ts', 'utf8');

// The block from `CREATE TABLE IF NOT EXISTS meeting_notes` down to the end of the file is messed up.
// I will slice the string and rebuild the end.

const idx = code.indexOf('CREATE TABLE IF NOT EXISTS meeting_notes');
const beginning = code.substring(0, idx);

const ending = `CREATE TABLE IF NOT EXISTS meeting_notes (
          vkn VARCHAR(50),
          id VARCHAR(255) PRIMARY KEY,
          customerId VARCHAR(255),
          date VARCHAR(50),
          notes TEXT,
          nextContactDate VARCHAR(50),
          personnelId VARCHAR(255)
        )
      \`);
      await client.query(\`
        CREATE TABLE IF NOT EXISTS documents (
          vkn VARCHAR(50),
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255),
          category VARCHAR(100),
          tags JSON,
          uploadDate VARCHAR(50),
          size INTEGER,
          type VARCHAR(100),
          url TEXT,
          uploadedBy VARCHAR(255),
          relatedEntityId VARCHAR(255)
        )
      \`);
      await client.query(\`
        CREATE TABLE IF NOT EXISTS waybills (
          vkn VARCHAR(50),
          id VARCHAR(255) PRIMARY KEY,
          supplierId VARCHAR(255),
          documentNo VARCHAR(255),
          date DATETIME,
          items JSON,
          totalAmount DECIMAL(15,2)
        )
      \`);
    } catch (e: any) {
      console.error('CREATE job_applications or new tables:', e.message);
    }
    console.log("Database initialized successfully.");
  } catch (err) {
    console.error('Error initializing database:', err);
  }
}
`;

fs.writeFileSync('server/db.ts', beginning + ending);
