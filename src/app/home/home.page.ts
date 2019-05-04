import { Component, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { Stitch, AnonymousCredential, RemoteMongoClient } from 'mongodb-stitch-browser-sdk'

export class BagTag {
  bagtag_number: string;
  bagtag_image: string;
  enabled: boolean;
  first_name: string;
  last_name: string;
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  bagTags: Array<BagTag> = [];
  client: any;
  db: any;
  user_id: string = "";

  constructor(
    public alertController: AlertController
  ) {

  }

  ngOnInit() {
    // const client = stitch.Stitch.initializeDefaultAppClient('thermaldetonators-uuznk');
    // const db = client.getServiceClient(stitch.RemoteMongoClient.factory, 'mongodb1').db('<DATABASE>');
    this.initializeAndLogin();
  }

  initializeAndLogin() {
    var that = this;
    this.client = Stitch.initializeDefaultAppClient('thermaldetonators-uuznk');
    this.db = this.client.getServiceClient(RemoteMongoClient.factory, 'mongodb-atlas').db('thermaldetonators');
    this.client.auth.loginWithCredential(new AnonymousCredential()).then(user => {
      console.log(`logged in anonymously as user ${user.id}`)
      this.user_id = user.id;
    })
    .then(() => {
      that.getAllBagTags();
    });
  }

  getAllBagTags() {
    var that = this;
    that.bagTags = [];
    this.db.collection('td').find({enabled: true}).asArray()
    .then(docs => {
        console.log("Found docs", docs);
        console.log("[MongoDB Stitch] Connected to Stitch");

        docs.forEach(function(doc) {
          let newBagTag = new BagTag();
          newBagTag.bagtag_number = doc.bagtag_number;
          newBagTag.first_name = doc.first_name;
          newBagTag.last_name = doc.last_name;
          newBagTag.bagtag_image = doc.bagtag_image;
          newBagTag.enabled = doc.enabled;

          that.bagTags.push(newBagTag);
        });

    }).catch(err => {
      console.error(err)
    });
  }

  addNewBagTagToDB(bagtag: BagTag) {
    console.log("comes in addNewBagTagToDB");
    var that = this;
    this.db.collection('td').insertOne({
      bagtag_number: bagtag.bagtag_number, 
      bagtag_image: bagtag.bagtag_image, 
      first_name: bagtag.first_name,
      last_name: bagtag.last_name,
      enabled: bagtag.enabled
    }).then(() => {
      that.getAllBagTags();
      that.presentInfoAlert("Success", "Bagtag successfully saved!!");
    });
  }

  updateBagTag(bagtag: BagTag) {
    var that = this;
    this.db.collection('td').updateOne(
      { "bagtag_number" : bagtag.bagtag_number },
      { $set: { "enabled" : bagtag.enabled } }
   ).then(() => {
    that.presentInfoAlert("Success", "Bagtag successfully updated!!");
   });
  }

  createNewBagTag() {
    console.log("Comes in createNewBagTag");
    this.presentAlertPrompt();
  }

  async presentAlertPrompt() {
    const alert = await this.alertController.create({
      header: 'Enter Bag Tag!',
      inputs: [
        {
          name: 'bagtag',
          type: 'text',
          placeholder: 'BagTag Number'
        },
        {
          name: 'first_name',
          type: 'text',
          placeholder: 'First Name'
        },
        {
          name: 'last_name',
          type: 'text',
          placeholder: 'Last Name'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
            console.log('Confirm Cancel');
          }
        }, {
          text: 'Ok',
          handler: data => {
            console.log('Confirm Ok');
            console.log(data.bagtag);

            if(data.bagtag != "" && data.bagtag.length == 10 && data.first_name != "" && data.last_name != "") {
              let newBagtag = new BagTag();
              newBagtag.bagtag_number = data.bagtag;
              newBagtag.first_name = data.first_name;
              newBagtag.last_name = data.last_name;
              newBagtag.bagtag_image = "";
              newBagtag.enabled = true;

              this.addNewBagTagToDB(newBagtag);
            }
            else if(data.bagtag.length != 10){
              this.presentInfoAlert("Error", "Please enter a 10 digit bag tag!");
            }
            else if(data.first_name == ""){
              this.presentInfoAlert("Error", "Please enter first name!");
            }
            else if(data.last_name == ""){
              this.presentInfoAlert("Error", "Please enter last name!");
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async presentInfoAlert(title: string, message: string) {
    const alert = await this.alertController.create({
      header: title,
      message: message,
      buttons: ['OK']
    });

    await alert.present();
  }

  bagTagToggled(bagtag: BagTag) {
    console.log("comes in bagTagToggled", bagtag);
    this.updateBagTag(bagtag);
  }
}
