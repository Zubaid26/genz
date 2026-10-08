"""
Model Handler for Dressing-in-Order Virtual Try-On
Handles model loading, data management, and inference
"""

import os
import sys
import torch
import numpy as np
from typing import List, Dict, Optional

# Add the dressing-in-order directory to path
sys.path.insert(0, './dressing-in-order')

from models.dior_model import DIORModel
from datasets.deepfashion_datasets import DFVisualDataset


class DressingInOrderHandler:
    """Handler for Dressing-in-Order model"""
    
    def __init__(self, dataroot: str, checkpoint_path: str):
        """
        Initialize the model handler
        
        Args:
            dataroot: Path to the data directory
            checkpoint_path: Path to the model checkpoint
        """
        self.dataroot = dataroot
        self.checkpoint_path = checkpoint_path
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        
        # Initialize model
        self.model = self._load_model()
        
        # Initialize dataset
        self.dataset = DFVisualDataset(
            dataroot=dataroot,
            dim=(256, 176),
            n_human_part=8
        )
        
        # Preload inputs
        print("Preloading dataset...")
        self.inputs = dict()
        for attr in self.dataset.attr_keys:
            self.inputs[attr] = self.dataset.get_attr_visual_input(attr)
        print(f"Loaded {len(self.inputs)} categories")
    
    def _load_model(self):
        """Load the Dressing-in-Order model"""
        # Create options object
        class Opt:
            def __init__(self):
                pass
        
        opt = Opt()
        opt.dataroot = self.dataroot
        opt.isTrain = False
        opt.phase = 'test'
        opt.n_human_parts = 8
        opt.n_kpts = 18
        opt.style_nc = 64
        opt.n_style_blocks = 4
        opt.netG = 'diorv1'
        opt.netE = 'adgan'
        opt.ngf = 64
        opt.norm_type = 'instance'
        opt.relu_type = 'leakyrelu'
        opt.init_type = 'orthogonal'
        opt.init_gain = 0.02
        opt.gpu_ids = [0] if torch.cuda.is_available() else []
        opt.frozen_flownet = True
        opt.random_rate = 1
        opt.perturb = False
        opt.warmup = False
        opt.name = 'DIORv1_64'
        opt.vgg_path = ''
        opt.flownet_path = ''
        opt.checkpoints_dir = os.path.dirname(self.checkpoint_path)
        opt.frozen_enc = True
        opt.load_iter = 0
        opt.epoch = 'latest'
        opt.verbose = False
        
        # Create and setup model
        model = DIORModel(opt)
        model.setup(opt)
        model.eval()
        
        return model
    
    def _load_img(self, pid: tuple):
        """
        Load image from dataset
        
        Args:
            pid: Tuple of (category, index, garment_type)
        """
        if len(pid[0]) < 10:  # Load pre-selected models
            person = self.inputs[pid[0]]
            person = (i.to(self.device) for i in person)
            pimg, parse, to_pose = person
            pimg = pimg[pid[1]]
            parse = parse[pid[1]]
            to_pose = to_pose[pid[1]]
        else:  # Load model from scratch
            person = self.dataset.get_inputs_by_key(pid[0])
            person = (i.to(self.device) for i in person)
            pimg, parse, to_pose = person
        
        return pimg.squeeze(), parse.squeeze(), to_pose.squeeze()
    
    def get_categories(self) -> List[str]:
        """Get list of available categories"""
        return list(self.inputs.keys())
    
    def get_available_persons(self) -> List[Dict]:
        """Get list of available persons"""
        persons = []
        
        for category in self.inputs.keys():
            # Get the number of items in this category
            data = self.inputs[category]
            n_items = data[0].shape[0]  # First element is images tensor
            
            for idx in range(n_items):
                persons.append({
                    "category": category,
                    "index": idx,
                    "preview_url": f"/api/person-image/{category}/{idx}"
                })
        
        return persons
    
    def get_available_garments(self, garment_type: Optional[int] = None) -> List[Dict]:
        """
        Get list of available garments
        
        Args:
            garment_type: Filter by garment type (1=bottom, 2=hair, 3=jacket, 5=top)
        """
        garments = []
        garment_names = {1: "bottom", 2: "hair", 3: "jacket", 5: "top"}
        
        for category in self.inputs.keys():
            data = self.inputs[category]
            n_items = data[0].shape[0]
            
            for idx in range(n_items):
                # Add garments of different types
                for gtype in [1, 2, 3, 5]:
                    if garment_type is None or gtype == garment_type:
                        garments.append({
                            "category": category,
                            "index": idx,
                            "garment_type": gtype,
                            "garment_name": garment_names[gtype],
                            "preview_url": f"/api/garment-image/{category}/{idx}/{gtype}"
                        })
        
        return garments
    
    def get_person_preview(self, category: str, index: int):
        """Get preview image of a person"""
        if category not in self.inputs:
            raise ValueError(f"Category '{category}' not found")
        
        pimg, _, _ = self._load_img((category, index, None))
        return pimg
    
    def get_garment_preview(self, category: str, index: int, garment_type: int):
        """Get preview image of a specific garment"""
        if category not in self.inputs:
            raise ValueError(f"Category '{category}' not found")
        
        pimg, parse, _ = self._load_img((category, index, None))
        
        # Extract the specific garment
        garment_img = pimg * (parse == garment_type)
        
        return garment_img
    
    def try_on(
        self,
        person_category: str,
        person_index: int,
        garments: List[Dict],
        dressing_order: List[int] = [2, 5, 1, 3],
        pose_transfer: Optional[Dict] = None
    ):
        """
        Perform virtual try-on
        
        Args:
            person_category: Category of the person
            person_index: Index of the person in the category
            garments: List of garments to try on [{"category": str, "index": int, "type": int}]
            dressing_order: Order of dressing [hair=2, top=5, bottom=1, jacket=3]
            pose_transfer: Optional pose transfer {"category": str, "index": int}
        
        Returns:
            Generated image tensor
        """
        PID = [0, 4, 6, 7]  # Person ID parts
        
        # Load person
        pid = (person_category, person_index, None)
        pimg, parse, from_pose = self._load_img(pid)
        
        # Handle pose transfer
        if pose_transfer:
            _, _, to_pose = self._load_img((pose_transfer["category"], pose_transfer["index"], None))
        else:
            to_pose = from_pose
        
        # Encode person
        psegs = self.model.encode_attr(
            pimg[None], parse[None], from_pose[None], to_pose[None], PID
        )
        
        # Encode base garments
        gsegs = self.model.encode_attr(
            pimg[None], parse[None], from_pose[None], to_pose[None]
        )
        
        # Swap garments
        for garment in garments:
            gid = (garment["category"], garment["index"], garment["type"])
            gimg, gparse, pose = self._load_img(gid)
            seg = self.model.encode_single_attr(
                gimg[None], gparse[None], pose[None], to_pose[None], i=gid[2]
            )
            gsegs[gid[2]] = seg
        
        # Apply dressing order
        gsegs_ordered = [gsegs[i] for i in dressing_order]
        
        # Generate image
        with torch.no_grad():
            gen_img = self.model.netG(to_pose[None], psegs, gsegs_ordered)
        
        return gen_img[0]
    
    def dress_in_order(
        self,
        pid: tuple,
        pose_id: Optional[tuple] = None,
        gids: List[tuple] = [],
        ogids: List[tuple] = [],
        order: List[int] = [5, 1, 3, 2],
        perturb: bool = False
    ):
        """
        Original dress_in_order function from the notebook
        
        Args:
            pid: Person ID tuple (category, index, garment_type)
            pose_id: Optional pose transfer ID
            gids: List of garment IDs to swap
            ogids: List of overlay garment IDs
            order: Dressing order
            perturb: Whether to perturb the image
        
        Returns:
            Tuple of (pimg, gimgs, oimgs, gen_img, to_pose)
        """
        PID = [0, 4, 6, 7]
        
        # Encode person
        pimg, parse, from_pose = self._load_img(pid)
        
        if not pose_id:
            to_pose = from_pose
        else:
            _, _, to_pose = self._load_img(pose_id)
        
        psegs = self.model.encode_attr(
            pimg[None], parse[None], from_pose[None], to_pose[None], PID
        )
        
        # Encode base garments
        gsegs = self.model.encode_attr(
            pimg[None], parse[None], from_pose[None], to_pose[None]
        )
        
        # Swap base garments
        gimgs = []
        for gid in gids:
            gimg, gparse, pose = self._load_img(gid)
            seg = self.model.encode_single_attr(
                gimg[None], gparse[None], pose[None], to_pose[None], i=gid[2]
            )
            gsegs[gid[2]] = seg
            gimgs += [gimg * (gparse == gid[2])]
        
        # Encode overlay garments
        over_gsegs = []
        oimgs = []
        for gid in ogids:
            oimg, oparse, pose = self._load_img(gid)
            oimgs += [oimg * (oparse == gid[2])]
            seg = self.model.encode_single_attr(
                oimg[None], oparse[None], pose[None], to_pose[None], i=gid[2]
            )
            over_gsegs += [seg]
        
        gsegs = [gsegs[i] for i in order] + over_gsegs
        
        with torch.no_grad():
            gen_img = self.model.netG(to_pose[None], psegs, gsegs)
        
        return pimg, gimgs, oimgs, gen_img[0], to_pose
